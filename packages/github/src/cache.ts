import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
  sha?: string;
}

export class FileCache {
  private baseDir: string;

  constructor(customDir?: string) {
    this.baseDir = customDir || path.join(os.homedir(), '.contribpilot', 'cache');
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
      }
    } catch {
      // Ignore
    }
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.baseDir, `${safeKey}.json`);
  }

  get<T>(key: string, maxAgeMs?: number): T | null {
    const file = this.getFilePath(key);
    if (!fs.existsSync(file)) return null;
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (maxAgeMs && Date.now() - entry.timestamp > maxAgeMs) {
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T, opts?: { etag?: string; sha?: string }): void {
    const file = this.getFilePath(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag: opts?.etag,
      sha: opts?.sha,
    };
    try {
      fs.writeFileSync(file, JSON.stringify(entry), 'utf8');
    } catch {
      // Ignore write failure
    }
  }

  clear(): void {
    try {
      if (fs.existsSync(this.baseDir)) {
        const files = fs.readdirSync(this.baseDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.baseDir, file));
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const defaultCache = new FileCache();
