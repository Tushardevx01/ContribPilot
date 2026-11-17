import http from 'node:http';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { AuthError } from '@contribpilot/shared';
import type { AuthToken, UserProfile } from './index.js';

export interface OAuthPKCEChallenge {
  verifier: string;
  challenge: string;
}

export function generatePKCE(): OAuthPKCEChallenge {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export interface GoogleOAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

export class GoogleAuthService {
  constructor(private config: GoogleOAuthConfig = {}) {}

  buildAuthUrl(redirectUri: string, state: string, challenge: string): string {
    const clientId = this.config.clientId || process.env.GOOGLE_CLIENT_ID || 'contribpilot-cli';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async startLoopbackServer(timeoutMs = 120000): Promise<{
    port: number;
    waitForCallback: (expectedState: string) => Promise<string>;
    close: () => void;
  }> {
    let server: http.Server;

    const promise = new Promise<{
      port: number;
      waitForCallback: (expectedState: string) => Promise<string>;
      close: () => void;
    }>((resolve, reject) => {
      server = http.createServer();
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        const port = addr.port;

        const waitForCallback = (expectedState: string) => {
          return new Promise<string>((res, rej) => {
            const timer = setTimeout(() => {
              server.close();
              rej(new AuthError('OAuth callback timed out after 120 seconds.'));
            }, timeoutMs);

            server.on('request', (req, resp) => {
              const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${port}`);
              const code = reqUrl.searchParams.get('code');
              const state = reqUrl.searchParams.get('state');
              const error = reqUrl.searchParams.get('error');

              if (error) {
                clearTimeout(timer);
                resp.writeHead(400, { 'Content-Type': 'text/html' });
                resp.end('<h1>Authentication Failed</h1><p>You can close this tab and return to the CLI.</p>');
                server.close();
                rej(new AuthError(`Google OAuth error: ${error}`));
                return;
              }

              if (state !== expectedState) {
                clearTimeout(timer);
                resp.writeHead(400, { 'Content-Type': 'text/html' });
                resp.end('<h1>Invalid State</h1><p>CSRF state check failed.</p>');
                server.close();
                rej(new AuthError('State mismatch in OAuth callback. Possible CSRF attack.'));
                return;
              }

              if (!code) {
                resp.writeHead(400, { 'Content-Type': 'text/html' });
                resp.end('<h1>Missing code</h1>');
                return;
              }

              clearTimeout(timer);
              resp.writeHead(200, { 'Content-Type': 'text/html' });
              resp.end('<h1>Authentication Successful!</h1><p>You can close this window and return to the CLI.</p>');
              server.close();
              res(code);
            });
          });
        };

        resolve({
          port,
          waitForCallback,
          close: () => server.close(),
        });
      });

      server.on('error', (err) => {
        reject(err);
      });
    });

    return promise;
  }

  async exchangeCodeForToken(code: string, codeVerifier: string, redirectUri: string): Promise<AuthToken> {
    const clientId = this.config.clientId || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = this.config.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AuthError(`Token exchange failed: ${errText}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new AuthError('Failed to fetch Google user profile.');
    }
    const data = (await res.json()) as { email: string; name?: string; picture?: string };
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }
}
