export const VERSION = '0.1.0';

export interface ContribPilotSession {
  version: string;
}

export function createSession(): ContribPilotSession {
  return { version: VERSION };
}
