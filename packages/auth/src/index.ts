export * from './tokenStore.js';
export * from './oauth.js';

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
}

export interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}
