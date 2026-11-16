export interface GitHubRepoRef {
  owner: string;
  name: string;
}

export function parseGitHubUrl(url: string): GitHubRepoRef | null {
  const match = url
    .trim()
    .match(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/.*)?$/
    );
  if (!match || !match[1] || !match[2]) return null;
  return {
    owner: match[1],
    name: match[2].replace(/\.git$/, ''),
  };
}
