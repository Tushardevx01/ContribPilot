import type { AgentAdapter } from '@contribpilot/shared';

export interface AgentRegistry {
  getAvailableAgents(): Promise<AgentAdapter[]>;
}
