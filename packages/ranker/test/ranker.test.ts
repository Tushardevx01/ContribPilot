import { describe, it, expect } from 'vitest';
import { IssueScorer } from '../src/index.js';
import type { IssueEvidence, RepoProfile } from '@contribpilot/shared';

describe('IssueScorer', () => {
  const scorer = new IssueScorer();

  const mockProfile: RepoProfile = {
    owner: 'test',
    name: 'repo',
    headSha: 'abc',
    languages: { TypeScript: 100 },
    frameworks: [],
    commands: { test: 'npm test' },
    structure: [],
    hotspots: [{ path: 'src/index.ts', reason: 'entrypoint' }],
    todos: [],
    contributing: {
      hasGuide: true,
      aiPolicy: 'allowed',
      cla: false,
      dco: false,
      prTemplate: false,
    },
    summary: 'Mock repo',
  };

  it('filters out issues with active claims or assigned contributors', () => {
    const issues: IssueEvidence[] = [
      {
        number: 1,
        url: 'https://github.com/test/repo/issues/1',
        title: 'Claimed issue',
        labels: ['bug'],
        ageDays: 5,
        lastActivityDays: 2,
        commentCount: 2,
        assignees: ['alice'],
        claims: [{ user: 'alice', commentUrl: '', ageDays: 2 }],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: true, labeledHelpWanted: false, triaged: true },
        media: [],
        reproducible: 'yes',
        summary: '',
      },
      {
        number: 2,
        url: 'https://github.com/test/repo/issues/2',
        title: 'Free issue',
        labels: ['bug'],
        ageDays: 5,
        lastActivityDays: 2,
        commentCount: 0,
        assignees: [],
        claims: [],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: true, labeledHelpWanted: true, triaged: true },
        media: [],
        reproducible: 'yes',
        summary: '',
      },
    ];

    const { passed, filteredCount } = scorer.filterIssues(issues);
    expect(filteredCount).toBe(1);
    expect(passed.length).toBe(1);
    expect(passed[0]?.number).toBe(2);
  });

  it('ranks issues and tags the highest as mostRecommended', async () => {
    const issues: IssueEvidence[] = [
      {
        number: 10,
        url: 'https://github.com/test/repo/issues/10',
        title: 'Good first issue for beginners',
        labels: ['good first issue', 'documentation'],
        ageDays: 2,
        lastActivityDays: 1,
        commentCount: 1,
        assignees: [],
        claims: [],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: true, labeledHelpWanted: true, triaged: true },
        media: [],
        reproducible: 'yes',
        summary: '',
      },
      {
        number: 11,
        url: 'https://github.com/test/repo/issues/11',
        title: 'Old minor typo',
        labels: ['typo'],
        ageDays: 120,
        lastActivityDays: 90,
        commentCount: 0,
        assignees: [],
        claims: [],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: false, labeledHelpWanted: false, triaged: false },
        media: [],
        reproducible: 'unknown',
        summary: '',
      },
    ];

    const ranked = await scorer.rank('beginner', mockProfile, issues);
    expect(ranked.length).toBe(2);
    expect(ranked[0]?.issue.number).toBe(10);
    expect(ranked[0]?.mostRecommended).toBe(true);
    expect(ranked[1]?.mostRecommended).toBe(false);
  });
});
