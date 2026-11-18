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

  it('detects high-confidence active claims in comments', () => {
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
    expect(evidence.claims[0]?.confidence).toBe('high');
    expect(evidence.claims[0]?.status).toBe('active');
  });

  it('ignores quotes in blockquotes from previous users', () => {
    const rawIssue = {
      number: 102,
      title: 'Improve error handling',
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    const comments = [
      {
        body: '> I will work on this and submit a PR\nThanks for offering, but please follow the guidelines first.',
        created_at: new Date().toISOString(),
        user: { login: 'reviewer' },
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    // "reviewer" should NOT be identified as making a claim because the claim was in a blockquote
    expect(evidence.claims.length).toBe(0);
  });

  it('ignores historical statements and third-party questions', () => {
    const rawIssue = {
      number: 103,
      title: 'Crash on startup',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    const comments = [
      {
        body: 'I worked on this 6 months ago in the past, but the architecture has changed.',
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        user: { login: 'historical_user' },
      },
      {
        body: 'Can someone fix this bug please?',
        created_at: new Date().toISOString(),
        user: { login: 'user2' },
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    expect(evidence.claims.length).toBe(0);
  });

  it('marks claims abandoned when contributor later unassigns or steps back', () => {
    const rawIssue = {
      number: 104,
      title: 'Add telemetry exporter',
      created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    const comments = [
      {
        body: 'Please assign to me, I would like to work on this!',
        created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        user: { login: 'busy_dev' },
      },
      {
        body: 'Sorry, I got busy with work and cannot work on this. Please unassign me, free to take.',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        user: { login: 'busy_dev' },
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    expect(evidence.claims.length).toBe(1);
    expect(evidence.claims[0]?.user).toBe('busy_dev');
    expect(evidence.claims[0]?.status).toBe('abandoned');
  });

  it('marks older claims as stale', () => {
    const rawIssue = {
      number: 105,
      title: 'Add search bar',
      created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    const comments = [
      {
        body: 'I will take this issue!',
        created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
        user: { login: 'dormant_dev' },
      },
    ];

    const evidence = extractor.extractEvidence(rawIssue, comments, []);
    expect(evidence.claims.length).toBe(1);
    expect(evidence.claims[0]?.status).toBe('stale');
  });

  it('detects maintainer signals and help wanted labels', () => {
    const rawIssue = {
      number: 106,
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
