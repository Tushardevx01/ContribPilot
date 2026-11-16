import type { Level, RepoProfile, IssueEvidence } from '@contribpilot/shared';

export interface ContributionPlanOptions {
  level: Level;
  profile: RepoProfile;
  issue: IssueEvidence;
}

export function generateContributionPlanStub(opts: ContributionPlanOptions): string {
  return `# Contribution Plan: #${opts.issue.number} ${opts.issue.title}\n\nLevel: ${opts.level}\nRepo: ${opts.profile.owner}/${opts.profile.name}\n`;
}
