import type { Level, RepoProfile, IssueEvidence, RankedIssue } from '@contribpilot/shared';

export interface IssueRanker {
  rank(level: Level, profile: RepoProfile, issues: IssueEvidence[]): Promise<RankedIssue[]>;
}
