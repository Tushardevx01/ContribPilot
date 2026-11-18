import { describe, it, expect, vi } from 'vitest';
import {
  AstCodebaseAnalyzer,
  defaultAstAnalyzer,
  RepoHealthAuditor,
  StaticCodebaseAnalyzer,
} from '../src/index.js';
import type { GitHubService } from '@contribpilot/github';

describe('AstCodebaseAnalyzer', () => {
  const analyzer = new AstCodebaseAnalyzer();

  it('extracts exported functions, classes, interfaces, and dependencies from TypeScript code', () => {
    const code = `
      import { Octokit } from '@octokit/rest';
      import { RepoProfile } from '@contribpilot/shared';

      export interface EngineOptions {
        timeoutMs: number;
      }

      export class IssueSearchEngine {
        searchIssues(query: string): string[] {
          return [];
        }
      }

      export function calculateFitScore(effort: string): number {
        return 10;
      }
    `;

    const { symbols, dependencies } = analyzer.analyzeSourceCode('src/search.ts', code);

    expect(dependencies).toEqual([
      { from: 'src/search.ts', to: '@octokit/rest' },
      { from: 'src/search.ts', to: '@contribpilot/shared' },
    ]);

    const symbolNames = symbols.map((s) => s.name);
    expect(symbolNames).toContain('EngineOptions');
    expect(symbolNames).toContain('IssueSearchEngine');
    expect(symbolNames).toContain('searchIssues');
    expect(symbolNames).toContain('calculateFitScore');

    const fnSymbol = symbols.find((s) => s.name === 'calculateFitScore');
    expect(fnSymbol?.exported).toBe(true);
    expect(fnSymbol?.kind).toBe('function');
  });

  it('connects issue description tokens to relevant source code locations', () => {
    const files = new Map<string, string>();
    files.set(
      'packages/auth/src/tokenStore.ts',
      `
      export class TokenStore {
        getFallbackKey() { return "key"; }
        setSecret() {}
      }
      `
    );
    files.set(
      'packages/core/src/engine.ts',
      `
      import { TokenStore } from './tokenStore.js';
      export class ContribPilotEngine {
        generateContributionPack() {}
      }
      `
    );

    const graph = analyzer.buildModuleGraph(files);

    const issueText = 'Bug: TokenStore failed to derive fallbackKey during authentication';
    const matches = analyzer.findRelevantCodeLocations(issueText, graph);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.path).toBe('packages/auth/src/tokenStore.ts');
    expect(matches[0]?.matchedSymbols).toContain('TokenStore');
    expect(matches[0]?.matchedSymbols).toContain('getFallbackKey');
  });
});

describe('RepoHealthAuditor (Expanded Security Coverage)', () => {
  it('detects expanded secrets and distinguishes verified patterns from heuristics', async () => {
    const mockGitHub = {
      getRepoMeta: vi.fn().mockResolvedValue({
        owner: 'test',
        name: 'repo',
        stars: 100,
        language: 'TypeScript',
        defaultBranch: 'main',
        headSha: 'abc',
        pushedAt: '2026-01-01',
        openIssuesCount: 5,
      }),
      getRepoTree: vi.fn().mockResolvedValue([
        { path: 'src/index.ts', mode: '100644', type: 'blob', sha: '1' },
        { path: '.env', mode: '100644', type: 'blob', sha: '2' },
        { path: '.github/workflows/ci.yml', mode: '100644', type: 'blob', sha: '3' },
        { path: 'package.json', mode: '100644', type: 'blob', sha: '4' },
      ]),
      getRecentCommits: vi.fn().mockResolvedValue([
        {
          sha: 'deadbeef12345678',
          message:
            'feat: add Slack webhook ' +
            [
              'https:',
              '',
              'hooks.slack.com',
              'services',
              'T1234567890',
              'B1234567890',
              'abcdef123456789012345678',
            ].join('/'),
          author: 'dev',
        },
      ]),
      getFileContent: vi.fn().mockImplementation((_owner, _repo, path) => {
        if (path === '.env') {
          const mockStripe = [
            'STRIPE_SECRET_KEY=sk',
            'test',
            '51Mz00000000000000000000000000',
          ].join('_');
          const mockOpenAI = [
            'OPENAI_KEY=sk',
            'proj',
            '1234567890abcdef1234567890abcdef12345678',
          ].join('-');
          return `${mockStripe}\n${mockOpenAI}`;
        }
        if (path === '.github/workflows/ci.yml') {
          return 'name: CI\non: pull_request_target\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "${{ github.event.issue.body }}"';
        }
        if (path === 'package.json') {
          return JSON.stringify({
            dependencies: {
              lodash: '*',
            },
          });
        }
        return '';
      }),
    } as unknown as GitHubService;

    const auditor = new RepoHealthAuditor(mockGitHub);
    const result = await auditor.audit('test', 'repo');

    // 1. Secret leaks in commits and files
    expect(result.security.leaks.length).toBeGreaterThan(0);
    const slackLeak = result.security.leaks.find((l) => l.type.includes('Slack'));
    expect(slackLeak).toBeDefined();
    expect(slackLeak?.confidence).toBe('VERIFIED_PATTERN');

    const stripeLeak = result.security.leaks.find((l) => l.type.includes('Stripe'));
    expect(stripeLeak).toBeDefined();
    expect(stripeLeak?.confidence).toBe('VERIFIED_PATTERN');

    // 2. Configuration risks in workflows (heuristic)
    const scriptInjection = result.security.configurationRisks.find((r) =>
      r.type.includes('Script Injection')
    );
    expect(scriptInjection).toBeDefined();
    expect(scriptInjection?.confidence).toBe('HEURISTIC');

    // 3. Dependency risks (heuristic)
    const wildcardDep = result.security.dependencyRisks.find((r) =>
      r.type.includes('Wildcard Dependency')
    );
    expect(wildcardDep).toBeDefined();
    expect(wildcardDep?.confidence).toBe('HEURISTIC');

    // 4. Documented audit limitations
    expect(result.auditLimitations.length).toBeGreaterThan(0);
    expect(result.auditLimitations.some((l) => l.includes('Static Heuristic Scope'))).toBe(true);
  });
});
