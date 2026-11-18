import { Octokit } from '@octokit/rest';
import { RepoNotFoundError, RateLimitError } from '@contribpilot/shared';
import { FileCache, defaultCache } from './cache.js';
import { execSync } from 'node:child_process';

function getGhCliToken(): string | undefined {
  try {
    const out = execSync('gh auth token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1500,
    }).trim();
    if (out && out.length > 5 && !out.includes('no oauth token')) {
      return out;
    }
  } catch {
    // gh CLI not available or not logged in
  }
  return undefined;
}

export interface GitHubRepoMeta {
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  defaultBranch: string;
  headSha: string;
  pushedAt: string;
  openIssuesCount: number;
}

export interface TreeFileItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

export interface IssueDiscoveryOptions {
  maxIssues?: number;
  perPage?: number;
  page?: number;
}

export class GitHubService {
  private octokit: Octokit;
  private cache: FileCache;

  constructor(token?: string, cache?: FileCache) {
    const resolvedToken =
      token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || getGhCliToken() || undefined;

    this.octokit = new Octokit({
      auth: resolvedToken,
    });
    this.cache = cache || defaultCache;
  }

  async getRepoMeta(owner: string, repo: string): Promise<GitHubRepoMeta> {
    const cacheKey = `repo_${owner}_${repo}`;
    const cached = this.cache.get<GitHubRepoMeta>(cacheKey, 10 * 60 * 1000); // 10 min cache
    if (cached) return cached;

    try {
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      const { data: commitData } = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref: repoData.default_branch,
      });

      const meta: GitHubRepoMeta = {
        owner: repoData.owner.login,
        name: repoData.name,
        description: repoData.description || '',
        stars: repoData.stargazers_count,
        language: repoData.language || 'Unknown',
        defaultBranch: repoData.default_branch,
        headSha: commitData.sha,
        pushedAt: repoData.pushed_at || '',
        openIssuesCount: repoData.open_issues_count,
      };

      this.cache.set(cacheKey, meta, { sha: meta.headSha });
      return meta;
    } catch (err: unknown) {
      const stale = this.cache.getStale<GitHubRepoMeta>(cacheKey);
      if (stale) return stale;
      this.handleError(err, owner, repo);
    }
  }

  async getRepoTree(
    owner: string,
    repo: string,
    treeSha: string,
    maxFiles = 400
  ): Promise<TreeFileItem[]> {
    const cacheKey = `tree_${owner}_${repo}_${treeSha}`;
    const cached = this.cache.get<TreeFileItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true',
      });

      const files: TreeFileItem[] = (data.tree || [])
        .filter((item) => item.type === 'blob')
        .slice(0, maxFiles)
        .map((item) => ({
          path: item.path || '',
          mode: item.mode || '',
          type: item.type || '',
          sha: item.sha || '',
          size: item.size,
        }));

      this.cache.set(cacheKey, files, { sha: treeSha });
      return files;
    } catch (err: unknown) {
      const stale = this.cache.getStale<TreeFileItem[]>(cacheKey);
      if (stale) return stale;
      this.handleError(err, owner, repo);
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    ref?: string
  ): Promise<string | null> {
    const cacheKey = `file_${owner}_${repo}_${filePath}_${ref || 'head'}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached !== null) return cached;

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref,
      });

      if (!('content' in data)) return null;
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      this.cache.set(cacheKey, content);
      return content;
    } catch {
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<any | null> {
    const cacheKey = `issue_${owner}_${repo}_${issueNumber}`;
    const cached = this.cache.get<any>(cacheKey, 5 * 60 * 1000); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cached) return cached;

    try {
      const { data } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      // Filter out PRs masquerading as issues
      if (data.pull_request) {
        return null;
      }

      this.cache.set(cacheKey, data);
      return data;
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err) {
        if ((err as { status: number }).status === 404) {
          return null;
        }
      }
      this.handleError(err, owner, repo);
    }
  }

  async getOpenIssues(
    owner: string,
    repo: string,
    optionsOrPerPage: number | IssueDiscoveryOptions = 50
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any[]> {
    const isOptionsObj = typeof optionsOrPerPage === 'object';
    const maxIssues = isOptionsObj ? (optionsOrPerPage.maxIssues ?? 50) : optionsOrPerPage;
    const configuredPerPage = isOptionsObj
      ? (optionsOrPerPage.perPage ?? 50)
      : Math.min(maxIssues, 100);
    const perPage = Math.max(1, Math.min(100, configuredPerPage));
    let currentPage = isOptionsObj ? (optionsOrPerPage.page ?? 1) : 1;

    const cacheKey = `issues_${owner}_${repo}_max${maxIssues}_p${currentPage}`;
    const cached = this.cache.get<any[]>(cacheKey, 5 * 60 * 1000); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cached) return cached;

    const collected: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    try {
      while (collected.length < maxIssues) {
        const fetchCount = Math.min(perPage, maxIssues - collected.length);
        const { data } = await this.octokit.issues.listForRepo({
          owner,
          repo,
          state: 'open',
          per_page: fetchCount,
          page: currentPage,
          sort: 'updated',
          direction: 'desc',
        });

        if (!data || data.length === 0) {
          break;
        }

        // Filter out Pull Requests (GitHub issues API includes PRs)
        const issuesOnly = data.filter((item) => !item.pull_request);
        collected.push(...issuesOnly);

        if (data.length < fetchCount) {
          // Reached last page
          break;
        }

        currentPage++;
      }

      const result = collected.slice(0, maxIssues);
      this.cache.set(cacheKey, result);
      return result;
    } catch (err: unknown) {
      if (collected.length > 0) {
        // Return partial results if pagination encounters a rate limit or network error
        return collected.slice(0, maxIssues);
      }
      const stale = this.cache.getStale<unknown[]>(cacheKey);
      if (stale && stale.length > 0) return stale;
      this.handleError(err, owner, repo);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getIssueComments(owner: string, repo: string, issueNumber: number): Promise<any[]> {
    const cacheKey = `comments_${owner}_${repo}_${issueNumber}`;
    const cached = this.cache.get<any[]>(cacheKey, 15 * 60 * 1000); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cached) return cached;

    try {
      const { data } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 30,
      });
      this.cache.set(cacheKey, data);
      return data;
    } catch {
      return [];
    }
  }

  async getRecentCommits(
    owner: string,
    repo: string,
    perPage = 20
  ): Promise<{ sha: string; message: string; author?: string; date?: string }[]> {
    const cacheKey = `commits_${owner}_${repo}_${perPage}`;
    const cached = this.cache.get<
      { sha: string; message: string; author?: string; date?: string }[]
    >(cacheKey, 10 * 60 * 1000);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: perPage,
      });

      const list = data.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || c.author?.login || 'Unknown',
        date: c.commit.author?.date,
      }));

      this.cache.set(cacheKey, list);
      return list;
    } catch {
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getIssueTimeline(owner: string, repo: string, issueNumber: number): Promise<any[]> {
    const cacheKey = `timeline_${owner}_${repo}_${issueNumber}`;
    const cached = this.cache.get<any[]>(cacheKey, 15 * 60 * 1000); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cached) return cached;

    try {
      const { data } = await this.octokit.issues.listEventsForTimeline({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 30,
      });
      this.cache.set(cacheKey, data);
      return data;
    } catch {
      return [];
    }
  }

  private handleError(err: unknown, owner: string, repo: string): never {
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 404) {
        throw new RepoNotFoundError(`Repository "${owner}/${repo}" was not found or is private.`);
      }
      if (status === 403 || status === 429) {
        throw new RateLimitError(
          `GitHub API rate limit exceeded. Set a GitHub token with 'contribpilot config --github <token>' to increase limit.`
        );
      }
    }
    throw err;
  }
}
