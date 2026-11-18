import { describe, it, expect } from 'vitest';
import { ContributionPackGenerator } from '../src/index.js';
import type { RepoProfile, RankedIssue } from '@contribpilot/shared';

describe('ContributionPackGenerator', () => {
  const generator = new ContributionPackGenerator();

  const mockProfile: RepoProfile = {
    owner: 'facebook',
    name: 'react',
    headSha: 'head123',
    languages: { JavaScript: 100 },
    frameworks: ['React'],
    commands: { test: 'yarn test', build: 'yarn build', lint: 'yarn lint' },
    structure: [],
    hotspots: [{ path: 'packages/react/src/React.js', reason: 'entry' }],
    files: ['packages/react/src/React.js', 'packages/react/src/ReactHooks.js'],
    todos: [],
    contributing: {
      hasGuide: true,
      aiPolicy: 'allowed',
      cla: true,
      dco: false,
      prTemplate: true,
    },
    summary: 'React repo',
  };

  it('distinguishes verified files from speculative unverified hypotheses in generated plan', () => {
    const rankedIssue: RankedIssue = {
      issue: {
        number: 404,
        url: 'https://github.com/facebook/react/issues/404',
        title: 'Hook state mismatch in concurrent mode',
        labels: ['bug'],
        ageDays: 5,
        lastActivityDays: 2,
        commentCount: 3,
        assignees: [],
        claims: [],
        linkedPRs: [],
        maintainerSignals: { maintainerReplied: true, labeledHelpWanted: true, triaged: true },
        media: [],
        reproducible: 'yes',
        summary: 'Hook state mismatch in concurrent mode',
      },
      score: 90,
      breakdown: {},
      fitReason: 'Great fit',
      risks: ['Check concurrent mode test suite'],
      estimatedEffort: '1-2 days',
      likelyFiles: ['packages/react/src/ReactHooks.js'],
      verifiedFiles: ['packages/react/src/ReactHooks.js'],
      unverifiedFiles: ['packages/react/src/NonExistentFile.js'],
      mostRecommended: true,
    };

    const plan = generator.generate({
      level: 'intermediate',
      profile: mockProfile,
      rankedIssue,
    });

    // Contains clear distinction of verified vs unverified
    expect(plan).toContain('`packages/react/src/ReactHooks.js` *(verified in repository tree)*');
    expect(plan).toContain('Speculative AI Hypotheses (Unverified in Repository File Tree)');
    expect(plan).toContain(
      '`packages/react/src/NonExistentFile.js` *(path not verified in repository tree)*'
    );

    // Contains assumptions & hypotheses callout
    expect(plan).toContain('Assumptions & Hypotheses');
    expect(plan).toContain('Evidence Confidence: **HIGH**');

    // Grounded in verified commands and files
    expect(plan).toContain('yarn test');
    expect(plan).toContain('yarn build');
    expect(plan).toContain('yarn lint');
  });
});
