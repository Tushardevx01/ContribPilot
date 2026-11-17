export * from './adapters.js';
import type { AgentAdapter } from '@contribpilot/shared';

export interface AgentRegistry {
  getAvailableAgents(): Promise<AgentAdapter[]>;
}
