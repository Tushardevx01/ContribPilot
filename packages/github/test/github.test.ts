import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, EvidenceExtractor } from '../src/index.js';

describe('parseGitHubUrl', () => {
  it('parses standard https urls', () => {
    expect(parseGitHubUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      name: 'react',
    });
  });

  it('parses urls with .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/vuejs/core.git')).toEqual({
      owner: 'vuejs',
      name: 'core',
    });
  });

  it('parses urls with subpaths', () => {
    expect(parseGitHubUrl('https://github.com/microsoft/vscode/tree/main')).toEqual({
      owner: 'microsoft',
      name: 'vscode',
    });
  });

  it('parses owner/repo shorthand', () => {
    expect(parseGitHubUrl('google/gemini-cli')).toEqual({
      owner: 'google',
      name: 'gemini-cli',
    });
  });

  it('returns null on invalid url', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
  });
});

describe('EvidenceExtractor', () => {
  const extractor = new EvidenceExtractor();

  it('detects claims in comments', () => {
    const rawIssue = {
      number: 101,
      title: 'Fix memory leak',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      labels: [{ name: 'bug' }],
    };
    const comments = [
      {
        body: 'I can fix this, please assign to me!',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        user: { login: 'contributor1' },
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    expect(evidence.claims.length).toBe(1);
    expect(evidence.claims[0]?.user).toBe('contributor1');
  });

  it('detects maintainer signals and help wanted labels', () => {
    const rawIssue = {
      number: 102,
      title: 'Add support for dark mode',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [{ name: 'help wanted' }],
    };
    const comments = [
      {
        body: 'We would love a PR for this!',
        author_association: 'MEMBER',
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    expect(evidence.maintainerSignals.labeledHelpWanted).toBe(true);
    expect(evidence.maintainerSignals.maintainerReplied).toBe(true);
  });
});
