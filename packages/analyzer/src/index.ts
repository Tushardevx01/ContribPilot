import type { RepoProfile } from '@contribpilot/shared';

export interface CodebaseAnalyzer {
  analyze(owner: string, name: string): Promise<RepoProfile>;
}
