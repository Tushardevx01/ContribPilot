import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ContribPilotEngine } from '../src/index.js';
import type { GitHubRepoMeta, TreeFileItem } from '@contribpilot/github';
import type { RepoProfile, RankedIssue } from '@contribpilot/shared';
import fs from 'node:fs';
import path from 'node:path';

describe('ContribPilotEngine', () => {
  const tmpDir = path.join(process.cwd(), '.tmp-engine-test');

  beforeEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('regression: never falls back to top3[0] when requested issue is unavailable', async () => {
    const engine = new ContribPilotEngine();

    const mockProfile: RepoProfile = {
      owner: 'testowner',
      name: 'testrepo',
      headSha: 'abc123',
      languages: { TypeScript: 100 },
      frameworks: [],
      commands: { test: 'npm test', build: 'npm run build' },
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
      summary: 'Test repo',
    };

    const mockTop3: RankedIssue[] = [
      {
        issue: {
          number: 101,
          url: 'https://github.com/testowner/testrepo/issues/101',
          title: 'Top recommendation issue 101',
          labels: ['good first issue'],
          ageDays: 2,
          lastActivityDays: 1,
          commentCount: 1,
          assignees: [],
          claims: [],
          linkedPRs: [],
          maintainerSignals: { maintainerReplied: true, labeledHelpWanted: true, triaged: true },
          media: [],
          reproducible: 'yes',
          summary: 'Summary 101',
        },
        score: 95,
        breakdown: {},
        fitReason: 'Top fit',
        risks: [],
        estimatedEffort: '1 hour',
        likelyFiles: ['src/index.ts'],
        mostRecommended: true,
      },
    ];

    // Mock getRankedIssues to return top3 with issue 101
    vi.spyOn(engine, 'getRankedIssues').mockResolvedValue({
      profile: mockProfile,
      top3: mockTop3,
      totalOpenIssues: 1,
      filteredCount: 0,
    });

    // Mock getGitHubService to return null for issue 999 (not found or closed)
    const mockGitHub = {
      getIssue: vi.fn().mockResolvedValue(null),
    };
    // @ts-expect-error accessing protected/private method for test
    vi.spyOn(engine, 'getGitHubService').mockResolvedValue(mockGitHub);

    // Requesting issue 999 MUST throw and NOT silently return issue 101
    await expect(
      engine.generateContributionPack(
        'https://github.com/testowner/testrepo',
        999,
        'beginner',
        tmpDir
      )
    ).rejects.toThrow(/Requested issue #999 was not found or is closed/i);

    // Verify no file was written for issue 101
    expect(fs.existsSync(path.join(tmpDir, 'CONTRIBUTION_PLAN.md'))).toBe(false);
  });

  it('selects the exact requested issue when found in top recommendations', async () => {
    const engine = new ContribPilotEngine();

    const mockProfile: RepoProfile = {
      owner: 'testowner',
      name: 'testrepo',
      headSha: 'abc123',
      languages: { TypeScript: 100 },
      frameworks: [],
      commands: { test: 'npm test', build: 'npm run build', lint: 'npm run lint' },
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
      summary: 'Test repo',
    };

    const mockTop3: RankedIssue[] = [
      {
        issue: {
          number: 101,
          url: 'https://github.com/testowner/testrepo/issues/101',
          title: 'Issue 101',
          labels: [],
          ageDays: 2,
          lastActivityDays: 1,
          commentCount: 0,
          assignees: [],
          claims: [],
          linkedPRs: [],
          maintainerSignals: { maintainerReplied: false, labeledHelpWanted: false, triaged: false },
          media: [],
          reproducible: 'yes',
          summary: 'Summary 101',
        },
        score: 80,
        breakdown: {},
        fitReason: 'Fit',
        risks: [],
        estimatedEffort: '1 hour',
        likelyFiles: ['src/index.ts'],
        mostRecommended: true,
      },
      {
        issue: {
          number: 102,
          url: 'https://github.com/testowner/testrepo/issues/102',
          title: 'Targeted issue 102',
          labels: ['bug'],
          ageDays: 3,
          lastActivityDays: 1,
          commentCount: 2,
          assignees: [],
          claims: [],
          linkedPRs: [],
          maintainerSignals: { maintainerReplied: true, labeledHelpWanted: true, triaged: true },
          media: [],
          reproducible: 'yes',
          summary: 'Summary 102',
        },
        score: 75,
        breakdown: {},
        fitReason: 'Fit 102',
        risks: [],
        estimatedEffort: '2 hours',
        likelyFiles: ['src/index.ts'],
        mostRecommended: false,
      },
    ];

    vi.spyOn(engine, 'getRankedIssues').mockResolvedValue({
      profile: mockProfile,
      top3: mockTop3,
      totalOpenIssues: 2,
      filteredCount: 0,
    });

    const result = await engine.generateContributionPack(
      'https://github.com/testowner/testrepo',
      102,
      'intermediate',
      tmpDir
    );
    expect(result.branchName).toBe('fix/issue-102');
    expect(result.content).toContain('CONTRIBUTION PLAN: #102 Targeted issue 102');
    expect(fs.existsSync(result.planPath)).toBe(true);
  });
});
