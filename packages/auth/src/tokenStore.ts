import keytar from 'keytar';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import type { AuthToken, UserProfile } from './index.js';

const SERVICE_NAME = 'contribpilot';
const KEY_ACCESS_TOKEN = 'google_access_token';
const KEY_REFRESH_TOKEN = 'google_refresh_token';
const KEY_ID_TOKEN = 'google_id_token';
const KEY_EXPIRES_AT = 'google_token_expires_at';
const KEY_GEMINI_API = 'gemini_api_key';
const KEY_GITHUB_TOKEN = 'github_pat_token';
const KEY_PRO_LICENSE = 'pro_license_key';
const KEY_GROQ_API = 'groq_api_key';
const KEY_USER_PROFILE = 'user_profile';

export class TokenStore {
  private fallbackDir: string;
  private fallbackFile: string;
  private fallbackKey = crypto.createHash('sha256').update(os.userInfo().username + '_cp_salt').digest();
  private isKeytarAvailable = true;

  constructor(customDir?: string) {
    this.fallbackDir = customDir || path.join(os.homedir(), '.contribpilot');
    this.fallbackFile = path.join(this.fallbackDir, 'vault.dat');
    this.ensureDir();
  }

  private ensureDir(): void {
    try {
      if (!fs.existsSync(this.fallbackDir)) {
        fs.mkdirSync(this.fallbackDir, { recursive: true, mode: 0o700 });
      }
    } catch {
      // Ignored
    }
  }

  private readFallback(): Record<string, string> {
    this.ensureDir();
    if (!fs.existsSync(this.fallbackFile)) return {};
    try {
      const raw = fs.readFileSync(this.fallbackFile, 'utf8');
      const [ivHex, tagHex, encryptedHex] = raw.split(':');
      if (!ivHex || !tagHex || !encryptedHex) return {};
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.fallbackKey, iv);
      decipher.setAuthTag(tag);
      let dec = decipher.update(encryptedHex, 'hex', 'utf8');
      dec += decipher.final('utf8');
      return JSON.parse(dec);
    } catch {
      return {};
    }
  }

  private writeFallback(data: Record<string, string>): void {
    this.ensureDir();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.fallbackKey, iv);
    let enc = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const payload = `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
    fs.writeFileSync(this.fallbackFile, payload, { mode: 0o600 });
  }

  async setSecret(account: string, value: string): Promise<void> {
    if (this.isKeytarAvailable) {
      try {
        await keytar.setPassword(SERVICE_NAME, account, value);
        return;
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    store[account] = value;
    this.writeFallback(store);
  }

  async getSecret(account: string): Promise<string | null> {
    if (this.isKeytarAvailable) {
      try {
        const val = await keytar.getPassword(SERVICE_NAME, account);
        if (val) return val;
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    return store[account] ?? null;
  }

  async deleteSecret(account: string): Promise<boolean> {
    if (this.isKeytarAvailable) {
      try {
        return await keytar.deletePassword(SERVICE_NAME, account);
      } catch {
        this.isKeytarAvailable = false;
      }
    }
    const store = this.readFallback();
    if (account in store) {
      delete store[account];
      this.writeFallback(store);
      return true;
    }
    return false;
  }

  async setToken(token: AuthToken): Promise<void> {
    await this.setSecret(KEY_ACCESS_TOKEN, token.accessToken);
    if (token.refreshToken) await this.setSecret(KEY_REFRESH_TOKEN, token.refreshToken);
    if (token.idToken) await this.setSecret(KEY_ID_TOKEN, token.idToken);
    await this.setSecret(KEY_EXPIRES_AT, String(token.expiresAt));
  }

  async getToken(): Promise<AuthToken | null> {
    const accessToken = await this.getSecret(KEY_ACCESS_TOKEN);
    if (!accessToken) return null;
    const refreshToken = (await this.getSecret(KEY_REFRESH_TOKEN)) ?? undefined;
    const idToken = (await this.getSecret(KEY_ID_TOKEN)) ?? undefined;
    const expiresAtStr = await this.getSecret(KEY_EXPIRES_AT);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : Date.now() + 3600 * 1000;
    return { accessToken, refreshToken, idToken, expiresAt };
  }

  async clearToken(): Promise<void> {
    await this.deleteSecret(KEY_ACCESS_TOKEN);
    await this.deleteSecret(KEY_REFRESH_TOKEN);
    await this.deleteSecret(KEY_ID_TOKEN);
    await this.deleteSecret(KEY_EXPIRES_AT);
    await this.deleteSecret(KEY_USER_PROFILE);
  }

  private getAccountForProvider(provider: 'gemini' | 'github' | 'pro' | 'groq'): string {
    switch (provider) {
      case 'gemini':
        return KEY_GEMINI_API;
      case 'github':
        return KEY_GITHUB_TOKEN;
      case 'pro':
        return KEY_PRO_LICENSE;
      case 'groq':
        return KEY_GROQ_API;
    }
  }

  async setApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq', key: string): Promise<void> {
    const account = this.getAccountForProvider(provider);
    await this.setSecret(account, key);
  }

  async getApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq'): Promise<string | null> {
    const account = this.getAccountForProvider(provider);
    return await this.getSecret(account);
  }

  async deleteApiKey(provider: 'gemini' | 'github' | 'pro' | 'groq'): Promise<void> {
    const account = this.getAccountForProvider(provider);
    await this.deleteSecret(account);
  }

  async isProUser(): Promise<boolean> {
    const key = await this.getApiKey('pro');
    return !!key && key.trim().length > 0;
  }

  async setUserProfile(profile: UserProfile): Promise<void> {
    await this.setSecret(KEY_USER_PROFILE, JSON.stringify(profile));
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await this.getSecret(KEY_USER_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const defaultTokenStore = new TokenStore();
