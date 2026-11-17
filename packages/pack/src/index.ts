export * from './generator.js';
import type { Level, RepoProfile, IssueEvidence } from '@contribpilot/shared';

export interface ContributionPlanOptions {
  level: Level;
  profile: RepoProfile;
  issue: IssueEvidence;
}
