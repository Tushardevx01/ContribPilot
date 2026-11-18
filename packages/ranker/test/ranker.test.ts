import { describe, it, expect } from 'vitest';
import { IssueScorer, validateSuggestedFiles, normalizeRepoPath } from '../src/index.js';
import type { IssueEvidence, RepoProfile, LLMProvider } from '@contribpilot/shared';

describe('validateSuggestedFiles', () => {
  it('normalizes paths properly', () => {
    expect(normalizeRepoPath('./src/index.ts')).toBe('src/index.ts');
    expect(normalizeRepoPath('/packages/core/src/engine.ts')).toBe('packages/core/src/engine.ts');
    expect(normalizeRepoPath('src\\utils\\helper.ts')).toBe('src/utils/helper.ts');
  });

  it('separates verified files from non-existent AI hypotheses', () => {
    const knownFiles = [
      'packages/core/src/engine.ts',
      'packages/ranker/src/ranker.ts',
      'src/index.ts',
      'tests/unit.test.ts',
    ];

    const suggested = [
      './packages/core/src/engine.ts', // exact match with ./
      'src/index.ts', // exact match
      'packages/fake/nonexistent.ts', // invalid path
      'some/hallucinated/file.js', // invalid path
    ];

    const result = validateSuggestedFiles(suggested, knownFiles);
    expect(result.verified).toEqual(['packages/core/src/engine.ts', 'src/index.ts']);
    expect(result.unverified).toEqual([
      'packages/fake/nonexistent.ts',
      'some/hallucinated/file.js',
    ]);
  });
});

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
    files: ['src/index.ts', 'src/app.ts', 'src/utils.ts'],
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

  it('filters out issues with active claims or assigned contributors, but retains abandoned or stale claims', () => {
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
        claims: [
          { user: 'alice', commentUrl: '', ageDays: 2, status: 'active', confidence: 'high' },
        ],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: true, labeledHelpWanted: false, triaged: true },
        media: [],
        reproducible: 'yes',
        summary: '',
      },
      {
        number: 2,
        url: 'https://github.com/test/repo/issues/2',
        title: 'Free issue with abandoned claim',
        labels: ['bug'],
        ageDays: 30,
        lastActivityDays: 2,
        commentCount: 2,
        assignees: [],
        claims: [
          { user: 'bob', commentUrl: '', ageDays: 20, status: 'abandoned', confidence: 'high' },
        ],
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

  it('ranks issues, validates file paths, and tags the highest as mostRecommended', async () => {
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
    expect(ranked[0]?.likelyFiles).toEqual(['src/index.ts']);
    expect(ranked[0]?.verifiedFiles).toEqual(['src/index.ts']);
    expect(ranked[1]?.mostRecommended).toBe(false);
  });

  it('validates AI-generated likelyFiles against repository and flags unverified paths', async () => {
    const mockLlm: LLMProvider = {
      generateJson: async () => ({
        fitScore: 8,
        fitReason: 'Great fit',
        risks: ['Review tests'],
        effort: '1 hour',
        likelyFiles: ['src/app.ts', 'hallucinated/file.ts'],
      }),
    };

    const scorerWithLlm = new IssueScorer(mockLlm);
    const issues: IssueEvidence[] = [
      {
        number: 20,
        url: 'https://github.com/test/repo/issues/20',
        title: 'Fix typo in app',
        labels: ['good first issue'],
        ageDays: 1,
        lastActivityDays: 1,
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

    const ranked = await scorerWithLlm.rank('beginner', mockProfile, issues);
    expect(ranked.length).toBe(1);
    const item = ranked[0]!;
    // likelyFiles should contain only verified files
    expect(item.likelyFiles).toEqual(['src/app.ts']);
    expect(item.verifiedFiles).toEqual(['src/app.ts']);
    expect(item.unverifiedFiles).toEqual(['hallucinated/file.ts']);
    expect(item.risks.some((r) => r.includes('hallucinated/file.ts'))).toBe(true);
  });
});
