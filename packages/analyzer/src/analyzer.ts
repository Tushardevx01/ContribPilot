import type { RepoProfile } from '@contribpilot/shared';
import { GitHubService, type TreeFileItem } from '@contribpilot/github';

export class StaticCodebaseAnalyzer {
  constructor(private github: GitHubService) {}

  async analyze(owner: string, name: string): Promise<RepoProfile> {
    const meta = await this.github.getRepoMeta(owner, name);
    const tree: TreeFileItem[] = await this.github.getRepoTree(owner, name, meta.headSha);

    const languages: Record<string, number> = {};
    if (meta.language && meta.language !== 'Unknown') {
      languages[meta.language] = 100;
    }

    const frameworks: string[] = [];
    const commands: { build?: string; test?: string; lint?: string; dev?: string } = {};

    // 1. Detect manifests & commands
    const filePaths = new Set<string>(tree.map((t: TreeFileItem) => t.path));

    if (filePaths.has('package.json')) {
      const pkgContent = await this.github.getFileContent(owner, name, 'package.json', meta.headSha);
      if (pkgContent) {
        try {
          const pkg = JSON.parse(pkgContent);
          const scripts = pkg.scripts || {};
          if (scripts.build) commands.build = 'npm run build';
          if (scripts.test) commands.test = 'npm test';
          if (scripts.lint) commands.lint = 'npm run lint';
          if (scripts.dev || scripts.start) commands.dev = scripts.dev ? 'npm run dev' : 'npm start';

          const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          if (allDeps.react) frameworks.push('React');
          if (allDeps.vue) frameworks.push('Vue');
          if (allDeps.next) frameworks.push('Next.js');
          if (allDeps.express) frameworks.push('Express');
          if (allDeps.typescript) frameworks.push('TypeScript');
          if (allDeps.vite) frameworks.push('Vite');
          if (allDeps.jest || allDeps.vitest) frameworks.push('Vitest/Jest');
        } catch {
          // ignore json parse error
        }
      }
    } else if (filePaths.has('pyproject.toml') || filePaths.has('requirements.txt')) {
      frameworks.push('Python');
      commands.test = 'pytest';
      commands.lint = 'flake8';
    } else if (filePaths.has('Cargo.toml')) {
      frameworks.push('Rust');
      commands.build = 'cargo build';
      commands.test = 'cargo test';
    } else if (filePaths.has('go.mod')) {
      frameworks.push('Go');
      commands.test = 'go test ./...';
      commands.build = 'go build';
    }

    // 2. Directory structure roles
    const structure: { path: string; role: string }[] = [];
    const topDirs = new Set<string>(
      tree
        .map((t: TreeFileItem) => t.path.split('/')[0] || '')
        .filter((d: string) => d.length > 0 && !d.includes('.'))
    );

    for (const dir of Array.from(topDirs)) {
      let role = 'Source code directory';
      if (/test|tests|spec/i.test(dir)) role = 'Test suites and test fixtures';
      else if (/doc|docs/i.test(dir)) role = 'Documentation and guides';
      else if (/pkg|packages|apps/i.test(dir)) role = 'Monorepo workspaces / modules';
      else if (/scripts|tools/i.test(dir)) role = 'Build utilities and dev scripts';
      else if (/src|lib|core/i.test(dir)) role = 'Core application / library implementation';
      structure.push({ path: dir, role });
    }

    // 3. Contribution guide, CLA, DCO, and AI Policy
    let hasGuide = false;
    let aiPolicy: 'allowed' | 'restricted' | 'banned' | 'unknown' = 'unknown';
    let cla = false;
    let dco = false;
    const allPaths = Array.from(filePaths);
    const prTemplate = allPaths.some((p: string) => /pull_request_template/i.test(p));

    const contributingFile = allPaths.find((p: string) => /contributing/i.test(p));
    if (contributingFile) {
      hasGuide = true;
      const content = await this.github.getFileContent(owner, name, contributingFile, meta.headSha);
      if (content) {
        const lower = content.toLowerCase();
        if (
          lower.includes('no ai') ||
          lower.includes('ai-generated prs are not allowed') ||
          lower.includes('prohibit ai') ||
          lower.includes('ban ai')
        ) {
          aiPolicy = 'banned';
        } else if (
          lower.includes('ai disclosure') ||
          lower.includes('disclose ai') ||
          lower.includes('mention if generated with ai')
        ) {
          aiPolicy = 'restricted';
        } else {
          aiPolicy = 'allowed';
        }

        if (lower.includes('contributor license agreement') || lower.includes('cla')) {
          cla = true;
        }
        if (lower.includes('developer certificate of origin') || lower.includes('dco') || lower.includes('signed-off-by')) {
          dco = true;
        }
      }
    }

    // 4. Hotspots (entrypoints or key files)
    const hotspots: { path: string; reason: string }[] = [];
    for (const pathStr of allPaths) {
      if (/src\/(index|main|app)\.(ts|js|py|rs|go)/i.test(pathStr)) {
        hotspots.push({ path: pathStr, reason: 'Primary application entrypoint' });
      }
    }

    return {
      owner,
      name,
      headSha: meta.headSha,
      languages,
      frameworks,
      commands,
      structure,
      hotspots,
      todos: [],
      contributing: {
        hasGuide,
        aiPolicy,
        cla,
        dco,
        prTemplate,
      },
      summary: `${owner}/${name}: ${meta.description || 'Open-source repository'} (${meta.stars} stars, primary language: ${meta.language})`,
    };
  }
}
