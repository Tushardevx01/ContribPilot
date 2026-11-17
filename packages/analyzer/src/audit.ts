import type { GitHubService, TreeFileItem, GitHubRepoMeta } from '@contribpilot/github';
import { redactSecrets } from '@contribpilot/shared';

export interface SecretLeakFinding {
  type: string;
  source: string; // file path or commit sha
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  sample: string;
  remediation: string;
}

export interface CodeHealthReport {
  overallScore: number; // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';
  breakdown: {
    testing: number; // /25
    ciCd: number; // /25
    documentation: number; // /25
    maintainability: number; // /25
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface RepoAuditResult {
  repo: {
    owner: string;
    name: string;
    stars: number;
    language: string;
    pushedAt: string;
    openIssues: number;
  };
  executiveSummary: string;
  codeStructure: {
    architecturalStyle: string;
    totalFiles: number;
    directories: { path: string; role: string; fileCount: number }[];
    topLanguages: Record<string, number>;
  };
  health: CodeHealthReport;
  security: {
    safe: boolean;
    scannedItemsCount: number;
    leaks: SecretLeakFinding[];
  };
  generatedAt: string;
}

export class RepoHealthAuditor {
  constructor(private github: GitHubService) {}

  async audit(owner: string, name: string): Promise<RepoAuditResult> {
    const meta: GitHubRepoMeta = await this.github.getRepoMeta(owner, name);
    const tree: TreeFileItem[] = await this.github.getRepoTree(owner, name, meta.headSha, 500);
    const commits = await this.github.getRecentCommits(owner, name, 25);

    // 1. Analyze Architecture & Code Structure
    const structure = this.analyzeStructure(tree);

    // 2. Secret Leak Scanner (commits & files)
    const security = await this.scanForSecrets(owner, name, meta.headSha, tree, commits);

    // 3. Code Health Score & Quality Metrics
    const health = this.evaluateCodeHealth(tree, meta);

    // 4. Executive Summary
    const executiveSummary = this.generateExecutiveSummary(meta, structure, health, security);

    return {
      repo: {
        owner: meta.owner,
        name: meta.name,
        stars: meta.stars,
        language: meta.language,
        pushedAt: meta.pushedAt,
        openIssues: meta.openIssuesCount,
      },
      executiveSummary,
      codeStructure: structure,
      health,
      security,
      generatedAt: new Date().toISOString(),
    };
  }

  private analyzeStructure(tree: TreeFileItem[]) {
    const dirMap = new Map<string, number>();
    const isMonorepo = tree.some((f) => f.path.startsWith('packages/') || f.path.startsWith('apps/'));

    for (const item of tree) {
      const parts = item.path.split('/');
      if (parts.length > 1) {
        const topDir = parts[0] + (parts.length > 2 && (parts[0] === 'packages' || parts[0] === 'apps') ? '/' + parts[1] : '');
        dirMap.set(topDir, (dirMap.get(topDir) || 0) + 1);
      }
    }

    const directories = Array.from(dirMap.entries())
      .slice(0, 10)
      .map(([dir, count]) => {
        let role = 'General source directory';
        if (dir.includes('test') || dir.includes('spec')) role = 'Test suites & fixtures';
        else if (dir.includes('doc')) role = 'Documentation & guides';
        else if (dir.includes('src') || dir.includes('lib')) role = 'Core application logic';
        else if (dir.includes('packages')) role = 'Monorepo workspace package';
        else if (dir.includes('apps')) role = 'Application entry point';
        else if (dir.includes('.github')) role = 'CI/CD workflows & templates';
        return { path: dir, role, fileCount: count };
      });

    return {
      architecturalStyle: isMonorepo ? 'Modular Monorepo Architecture' : 'Single Package Architecture',
      totalFiles: tree.length,
      directories,
      topLanguages: this.inferTopLanguages(tree),
    };
  }

  private inferTopLanguages(tree: TreeFileItem[]): Record<string, number> {
    const extCount: Record<string, number> = {};
    for (const file of tree) {
      const ext = file.path.split('.').pop() || 'other';
      extCount[ext] = (extCount[ext] || 0) + 1;
    }
    return extCount;
  }

  private async scanForSecrets(
    owner: string,
    name: string,
    headSha: string,
    tree: TreeFileItem[],
    commits: { sha: string; message: string; author?: string; date?: string }[]
  ): Promise<{ safe: boolean; scannedItemsCount: number; leaks: SecretLeakFinding[] }> {
    const leaks: SecretLeakFinding[] = [];
    let scannedItemsCount = 0;

    // Secret Patterns
    const rules = [
      {
        name: 'AWS Access Key ID',
        regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        severity: 'CRITICAL' as const,
        remediation: 'Immediately revoke the AWS IAM Access Key in the AWS Console and invalidate associated sessions.',
      },
      {
        name: 'GitHub Personal Access Token',
        regex: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g,
        severity: 'CRITICAL' as const,
        remediation: 'Revoke the GitHub token at https://github.com/settings/tokens and check audit logs for unauthorized access.',
      },
      {
        name: 'Google Gemini / Cloud API Key',
        regex: /AIza[0-9A-Za-z-_]{35}/g,
        severity: 'HIGH' as const,
        remediation: 'Delete or rotate the API key in Google Cloud Console / Google AI Studio credentials page.',
      },
      {
        name: 'Private RSA/SSH Key',
        regex: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PRIVATE) KEY-----/g,
        severity: 'CRITICAL' as const,
        remediation: 'Remove private key immediately from repository history using git-filter-repo and rotate server keys.',
      },
      {
        name: 'Database Connection String With Password',
        regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:[^@\s]+@[^\s/]+/gi,
        severity: 'HIGH' as const,
        remediation: 'Rotate the database user password immediately and use environment secrets instead of hardcoded strings.',
      },
    ];

    // Scan commit messages
    for (const commit of commits) {
      scannedItemsCount++;
      for (const rule of rules) {
        const matches = commit.message.match(rule.regex);
        if (matches) {
          leaks.push({
            type: rule.name,
            source: `Commit ${commit.sha.slice(0, 7)} by ${commit.author || 'Author'}`,
            severity: rule.severity,
            sample: redactSecrets(matches[0]),
            remediation: rule.remediation,
          });
        }
      }
    }

    // Scan candidate sensitive files
    const sensitiveFileCandidates = tree.filter((f) => {
      const p = f.path.toLowerCase();
      return (
        p.endsWith('.env') ||
        p.includes('.env.') ||
        p.endsWith('.pem') ||
        p.endsWith('.key') ||
        p.includes('credentials') ||
        p.includes('secret') ||
        p.endsWith('config.json') ||
        p.endsWith('settings.json')
      );
    });

    for (const item of sensitiveFileCandidates.slice(0, 15)) {
      scannedItemsCount++;
      const content = await this.github.getFileContent(owner, name, item.path, headSha);
      if (!content) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i] || '';
        for (const rule of rules) {
          const matches = lineText.match(rule.regex);
          if (matches) {
            leaks.push({
              type: rule.name,
              source: `${item.path}:${i + 1}`,
              line: i + 1,
              severity: rule.severity,
              sample: redactSecrets(matches[0]),
              remediation: rule.remediation,
            });
          }
        }
      }
    }

    return {
      safe: leaks.length === 0,
      scannedItemsCount,
      leaks,
    };
  }

  private evaluateCodeHealth(tree: TreeFileItem[], meta: GitHubRepoMeta): CodeHealthReport {
    const paths = new Set(tree.map((t) => t.path.toLowerCase()));
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (meta.stars > 50) {
      strengths.push(`Active community project with ${meta.stars.toLocaleString()} GitHub stars.`);
    }

    // 1. Testing (/25)
    let testingScore = 0;
    const hasTests = tree.some((t) => t.path.toLowerCase().includes('test') || t.path.toLowerCase().includes('spec'));
    if (hasTests) {
      testingScore += 18;
      strengths.push('Dedicated automated test suite identified.');
    } else {
      weaknesses.push('No automated test directory or test files detected.');
      recommendations.push('Introduce unit tests and automated test suites (e.g. Vitest, Jest, PyTest, Cargo test).');
    }
    if (paths.has('vitest.config.ts') || paths.has('jest.config.js') || paths.has('pytest.ini')) {
      testingScore += 7;
      strengths.push('Standardized test runner configuration present.');
    }

    // 2. CI/CD (/25)
    let ciScore = 0;
    const hasWorkflows = tree.some((t) => t.path.startsWith('.github/workflows/'));
    if (hasWorkflows) {
      ciScore += 25;
      strengths.push('Active GitHub Actions CI/CD automation pipeline.');
    } else {
      weaknesses.push('No GitHub Actions or CI/CD pipelines found.');
      recommendations.push('Set up GitHub Actions to run tests, linting, and build verification on every pull request.');
    }

    // 3. Documentation (/25)
    let docScore = 0;
    if (paths.has('readme.md')) {
      docScore += 10;
      strengths.push('README.md present with project overview.');
    } else {
      weaknesses.push('Missing README.md documentation.');
      recommendations.push('Add a comprehensive README.md explaining installation, usage, and architecture.');
    }
    if (paths.has('contributing.md') || paths.has('.github/contributing.md')) {
      docScore += 8;
      strengths.push('Clear CONTRIBUTING.md guidelines for open-source contributors.');
    } else {
      recommendations.push('Add a CONTRIBUTING.md file outlining contribution workflow and pull request guidelines.');
    }
    if (paths.has('license') || paths.has('license.md') || paths.has('license.txt')) {
      docScore += 7;
      strengths.push('Open-source LICENSE declared.');
    } else {
      weaknesses.push('Missing LICENSE file.');
      recommendations.push('Add an open-source license (e.g. MIT, Apache 2.0).');
    }

    // 4. Maintainability (/25)
    let maintScore = 0;
    const hasTypeScript = tree.some((t) => t.path.endsWith('.ts') || t.path.endsWith('.tsx'));
    const hasRustGo = tree.some((t) => t.path.endsWith('.rs') || t.path.endsWith('.go'));
    if (hasTypeScript || hasRustGo) {
      maintScore += 13;
      strengths.push('Type safety enforced (TypeScript, Rust, or Go).');
    }
    const hasLinter = paths.has('eslint.config.js') || paths.has('.eslintrc.json') || paths.has('.prettierrc') || paths.has('biome.json');
    if (hasLinter) {
      maintScore += 12;
      strengths.push('Automated linting and formatting configured.');
    } else {
      recommendations.push('Add automated code formatting and static analysis (e.g. ESLint, Prettier, Biome, Ruff).');
    }

    const overallScore = Math.min(100, testingScore + ciScore + docScore + maintScore);
    let rating: CodeHealthReport['rating'] = 'NEEDS_IMPROVEMENT';
    if (overallScore >= 85) rating = 'EXCELLENT';
    else if (overallScore >= 70) rating = 'GOOD';
    else if (overallScore >= 50) rating = 'FAIR';

    return {
      overallScore,
      rating,
      breakdown: {
        testing: testingScore,
        ciCd: ciScore,
        documentation: docScore,
        maintainability: maintScore,
      },
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private generateExecutiveSummary(
    meta: GitHubRepoMeta,
    structure: ReturnType<typeof this.analyzeStructure>,
    health: CodeHealthReport,
    security: { safe: boolean; leaks: SecretLeakFinding[] }
  ): string {
    const secStatus = security.safe
      ? '✓ Zero secret leaks detected in analyzed files and recent commit history.'
      : `⚠️ ${security.leaks.length} sensitive secret leaks identified requiring immediate revocation.`;

    return `${meta.owner}/${meta.name} is a ${structure.architecturalStyle} project built primarily with ${meta.language}. Code health is rated ${health.rating} (${health.overallScore}/100) with ${health.strengths.length} established engineering practices. Security Audit: ${secStatus}`;
  }
}
