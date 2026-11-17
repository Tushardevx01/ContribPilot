export * from './client.js';
export * from './cache.js';
export * from './evidence.js';

export interface GitHubRepoRef {
  owner: string;
  name: string;
}

export function parseGitHubUrl(url: string): GitHubRepoRef | null {
  const cleaned = url.trim().replace(/^git@github\.com:/, 'https://github.com/');
  const match = cleaned.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/.*)?$/
  );
  if (match && match[1] && match[2]) {
    return {
      owner: match[1],
      name: match[2].replace(/\.git$/, ''),
    };
  }

  // Also support "owner/repo" shorthand
  const shorthand = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shorthand && shorthand[1] && shorthand[2]) {
    return {
      owner: shorthand[1],
      name: shorthand[2].replace(/\.git$/, ''),
    };
  }

  return null;
}
