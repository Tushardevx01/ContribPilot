import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
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

export function openBrowser(url: string): void {
  try {
    if (process.platform === 'win32') {
      const child = spawn('cmd.exe', ['/c', 'start', '""', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
    } else if (process.platform === 'darwin') {
      const child = spawn('open', [url], { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      const child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
      child.unref();
    }
  } catch {
    // If auto-open fails, terminal will show the clickable URL
  }
}

export function renderAuthPageHtml(title: string, message: string, isSuccess = true): string {
  const gradient = 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #ec4899 100%)';
  const icon = isSuccess ? '✓' : '✕';
  const iconColor = isSuccess ? '#10b981' : '#ef4444';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ContribPilot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px -10px rgba(99, 102, 241, 0.15);
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: 9999px;
      background: ${gradient};
      color: #fff;
      margin-bottom: 24px;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid ${iconColor};
      color: ${iconColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      margin: 0 auto 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .close-hint {
      background: #1e293b;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      color: #cbd5e1;
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">&gt; GEMINI ContribPilot</div>
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="close-hint">
      You can now safely close this browser window and return to your terminal.
    </div>
    <div class="footer">
      Developed by <a href="https://github.com/sayandeep0212" target="_blank">Sayandeep Pradhan</a>
    </div>
  </div>
</body>
</html>`;
}

export function startPaymentLoopbackServer(timeoutMs = 180000): Promise<{
  port: number;
  callbackUrl: string;
  waitForPayment: () => Promise<{ success: boolean; proKey?: string }>;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;
      const callbackUrl = `http://127.0.0.1:${port}/payment-success`;

      const waitForPayment = () => {
        return new Promise<{ success: boolean; proKey?: string }>((res) => {
          const timer = setTimeout(() => {
            server.close();
            res({ success: false });
          }, timeoutMs);

          server.on('request', (req, resp) => {
            const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${port}`);
            if (
              reqUrl.pathname.includes('payment-success') ||
              reqUrl.pathname.includes('callback')
            ) {
              clearTimeout(timer);
              const proKey =
                reqUrl.searchParams.get('pro_key') || reqUrl.searchParams.get('key') || undefined;
              const securityHeaders = {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Content-Security-Policy':
                  "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:;",
              };
              resp.writeHead(200, securityHeaders);
              resp.end(
                renderAuthPageHtml(
                  'Payment Successful!',
                  'ContribPilot Pro has been activated in your terminal! Enjoy hosted Gemini quota and deep repository audits.'
                )
              );
              server.close();
              res({ success: true, proKey });
            } else {
              resp.writeHead(404, { 'Content-Type': 'text/plain' });
              resp.end('Not found');
            }
          });
        });
      };

      resolve({
        port,
        callbackUrl,
        waitForPayment,
        close: () => server.close(),
      });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

export const DEFAULT_PAYMENT_URL = 'https://contribpilot.dev/pricing';

export function getPaymentUrl(userEmail?: string, customUrl?: string): string {
  const base = customUrl || process.env.CONTRIBPILOT_PAYMENT_URL || DEFAULT_PAYMENT_URL;
  if (!userEmail) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}email=${encodeURIComponent(userEmail)}`;
}

export function openPaymentPage(userEmail?: string, customUrl?: string): string {
  const targetUrl = getPaymentUrl(userEmail, customUrl);
  openBrowser(targetUrl);
  return targetUrl;
}

export interface GoogleOAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

export class GoogleAuthService {
  constructor(private config: GoogleOAuthConfig = {}) {}

  buildAuthUrl(redirectUri: string, state: string, challenge: string): string {
    const clientId = this.config.clientId || process.env.GOOGLE_CLIENT_ID || '';
    // Request openid, email, profile, AND generativelanguage scope so user's Gemini quota is automatically connected
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/generativelanguage',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
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
    redirectUri: string;
    waitForCallback: (expectedState: string) => Promise<string>;
    close: () => void;
  }> {
    let server: http.Server;

    const promise = new Promise<{
      port: number;
      redirectUri: string;
      waitForCallback: (expectedState: string) => Promise<string>;
      close: () => void;
    }>((resolve, reject) => {
      server = http.createServer();
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        const port = addr.port;
        const redirectUri = `http://127.0.0.1:${port}`;

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

              const securityHeaders = {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Content-Security-Policy':
                  "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:;",
              };

              if (error) {
                clearTimeout(timer);
                resp.writeHead(400, securityHeaders);
                resp.end(
                  renderAuthPageHtml('Authentication Failed', `Google OAuth error: ${error}`, false)
                );
                server.close();
                rej(new AuthError(`Google OAuth error: ${error}`));
                return;
              }

              if (state !== expectedState) {
                clearTimeout(timer);
                resp.writeHead(400, securityHeaders);
                resp.end(
                  renderAuthPageHtml(
                    'Invalid State',
                    'CSRF state check failed. Possible interception attack prevented.',
                    false
                  )
                );
                server.close();
                rej(new AuthError('State mismatch in OAuth callback. Possible CSRF attack.'));
                return;
              }

              if (!code) {
                resp.writeHead(400, securityHeaders);
                resp.end(
                  renderAuthPageHtml(
                    'Missing Code',
                    'No authorization code returned from Google.',
                    false
                  )
                );
                return;
              }

              clearTimeout(timer);
              resp.writeHead(200, securityHeaders);
              resp.end(
                renderAuthPageHtml(
                  'Authentication Successful!',
                  'Your Google Gemini quota has been connected to ContribPilot. You can now close this tab.'
                )
              );
              server.close();
              res(code);
            });
          });
        };

        resolve({
          port,
          redirectUri,
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

  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<AuthToken> {
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

  async refreshAccessToken(refreshToken: string): Promise<AuthToken> {
    const clientId = this.config.clientId || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = this.config.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AuthError(`Token refresh failed: ${errText}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      id_token?: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken,
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

  async fetchGeminiQuota(
    accessToken: string
  ): Promise<{ active: boolean; models: string[]; message: string }> {
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          return {
            active: false,
            models: [],
            message:
              'Gemini API quota requires enabling Generative Language API in your Google Cloud Project.',
          };
        }
        return {
          active: false,
          models: [],
          message: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = (await res.json()) as { models?: { name: string; displayName?: string }[] };
      const modelNames = (data.models || []).map((m) => m.name.replace('models/', ''));
      return {
        active: true,
        models: modelNames,
        message: `Active Gemini quota verified with ${modelNames.length} models available.`,
      };
    } catch (err: unknown) {
      return {
        active: false,
        models: [],
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
