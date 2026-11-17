import { Octokit } from '@octokit/rest';
import { RepoNotFoundError, RateLimitError } from '@contribpilot/shared';
import { FileCache, defaultCache } from './cache.js';

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

export class GitHubService {
  private octokit: Octokit;
  private cache: FileCache;

  constructor(token?: string, cache?: FileCache) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN || undefined,
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
      this.handleError(err, owner, repo);
    }
  }

  async getRepoTree(owner: string, repo: string, treeSha: string, maxFiles = 400): Promise<TreeFileItem[]> {
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
      this.handleError(err, owner, repo);
    }
  }

  async getFileContent(owner: string, repo: string, filePath: string, ref?: string): Promise<string | null> {
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

  async getOpenIssues(owner: string, repo: string, perPage = 50): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const cacheKey = `issues_${owner}_${repo}`;
    const cached = this.cache.get<any[]>(cacheKey, 5 * 60 * 1000); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cached) return cached;

    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      });

      // Filter out Pull Requests (GitHub issues API includes PRs)
      const issuesOnly = data.filter((item) => !item.pull_request);
      this.cache.set(cacheKey, issuesOnly);
      return issuesOnly;
    } catch (err: unknown) {
      this.handleError(err, owner, repo);
    }
  }

  async getIssueComments(owner: string, repo: string, issueNumber: number): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  async getIssueTimeline(owner: string, repo: string, issueNumber: number): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
