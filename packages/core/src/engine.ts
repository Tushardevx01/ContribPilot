import fs from 'node:fs';
import path from 'node:path';
import { defaultTokenStore } from '@contribpilot/auth';
import { GitHubService, parseGitHubUrl, defaultEvidenceExtractor } from '@contribpilot/github';
import { StaticCodebaseAnalyzer } from '@contribpilot/analyzer';
import { IssueScorer } from '@contribpilot/ranker';
import { GoogleGenAIProvider, MockLLMProvider } from '@contribpilot/llm';
import { defaultPackGenerator } from '@contribpilot/pack';
import { defaultAgentDetector } from '@contribpilot/handoff';
import { GenericError, RepoNotFoundError } from '@contribpilot/shared';
import type { Level, RepoProfile, RankedIssue, IssueEvidence, LLMProvider } from '@contribpilot/shared';

export interface EngineEvents {
  onProgress?: (message: string) => void;
  onWarning?: (message: string) => void;
}

export class ContribPilotEngine {
  constructor(private events: EngineEvents = {}) {}

  private async getGitHubService(): Promise<GitHubService> {
    const token = (await defaultTokenStore.getApiKey('github')) || process.env.GITHUB_TOKEN || undefined;
    return new GitHubService(token);
  }

  private async getLLMProvider(): Promise<LLMProvider> {
    const geminiKey = (await defaultTokenStore.getApiKey('gemini')) || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      return new GoogleGenAIProvider(geminiKey);
    }
    // Fall back to MockLLMProvider if no key is configured
    return new MockLLMProvider();
  }

  async analyzeRepo(repoUrl: string): Promise<RepoProfile> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(`Invalid GitHub URL or shorthand: "${repoUrl}". Expected format: https://github.com/owner/repo or owner/repo`);
    }

    const github = await this.getGitHubService();
    const analyzer = new StaticCodebaseAnalyzer(github);

    this.events.onProgress?.(`Analyzing repository ${ref.owner}/${ref.name}...`);
    return await analyzer.analyze(ref.owner, ref.name);
  }

  async getRankedIssues(
    repoUrl: string,
    level: Level,
    options?: { profile?: RepoProfile }
  ): Promise<{ profile: RepoProfile; top3: RankedIssue[]; totalOpenIssues: number; filteredCount: number }> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(`Invalid GitHub URL or shorthand: "${repoUrl}".`);
    }

    const profile = options?.profile || (await this.analyzeRepo(repoUrl));
    const github = await this.getGitHubService();

    this.events.onProgress?.(`Fetching open issues for ${ref.owner}/${ref.name}...`);
    const rawIssues = await github.getOpenIssues(ref.owner, ref.name, 40);

    this.events.onProgress?.(`Extracting evidence & checking claims across ${rawIssues.length} issues...`);
    const evidences: IssueEvidence[] = [];

    // Extract evidence for issues
    for (const raw of rawIssues.slice(0, 20)) {
      const [comments, timeline] = await Promise.all([
        github.getIssueComments(ref.owner, ref.name, raw.number),
        github.getIssueTimeline(ref.owner, ref.name, raw.number),
      ]);
      evidences.push(defaultEvidenceExtractor.extractEvidence(raw, comments, timeline));
    }

    const llm = await this.getLLMProvider();
    const ranker = new IssueScorer(llm);

    this.events.onProgress?.(`Scoring and ranking candidates for ${level} level...`);
    const { filteredCount } = ranker.filterIssues(
      evidences,
      profile.contributing.aiPolicy === 'banned'
    );
    const top3 = await ranker.rank(level, profile, evidences);

    return {
      profile,
      top3,
      totalOpenIssues: rawIssues.length,
      filteredCount,
    };
  }

  async generateContributionPack(
    repoUrl: string,
    issueNumber: number,
    level: Level,
    outDir?: string
  ): Promise<{ planPath: string; content: string; branchName: string }> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(`Invalid GitHub URL: "${repoUrl}"`);
    }

    const { profile, top3 } = await this.getRankedIssues(repoUrl, level);
    const picked = top3.find((r) => r.issue.number === issueNumber) || top3[0];

    if (!picked) {
      throw new GenericError(`Could not find or rank issue #${issueNumber}`);
    }

    const content = defaultPackGenerator.generate({
      level,
      profile,
      rankedIssue: picked,
    });

    const targetDir = outDir || path.join(process.cwd(), '.contribpilot', `${ref.owner}-${ref.name}-${picked.issue.number}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const planPath = path.join(targetDir, 'CONTRIBUTION_PLAN.md');
    fs.writeFileSync(planPath, content, 'utf8');

    const branchName = `fix/issue-${picked.issue.number}`;
    return { planPath, content, branchName };
  }

  async getDetectedAgents() {
    return await defaultAgentDetector.getInstalledAgents();
  }
}
