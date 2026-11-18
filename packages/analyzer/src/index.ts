export * from './analyzer.js';
export * from './audit.js';
export * from './ast.js';
import type { RepoProfile } from '@contribpilot/shared';

export interface CodebaseAnalyzer {
  analyze(owner: string, name: string): Promise<RepoProfile>;
}
