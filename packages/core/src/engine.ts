import fs from 'node:fs';
import path from 'node:path';
import { defaultTokenStore, GoogleAuthService } from '@contribpilot/auth';
import { GitHubService, parseGitHubUrl, defaultEvidenceExtractor } from '@contribpilot/github';
import {
  StaticCodebaseAnalyzer,
  RepoHealthAuditor,
  type RepoAuditResult,
} from '@contribpilot/analyzer';
import { IssueScorer } from '@contribpilot/ranker';
import {
  GoogleGenAIProvider,
  GroqProvider,
  FallbackLLMProvider,
  MockLLMProvider,
} from '@contribpilot/llm';
import { defaultPackGenerator } from '@contribpilot/pack';
import { defaultAgentDetector } from '@contribpilot/handoff';
import { GenericError, RepoNotFoundError } from '@contribpilot/shared';
import type { Level, RepoProfile, RankedIssue, LLMProvider } from '@contribpilot/shared';

export interface EngineEvents {
  onProgress?: (message: string) => void;
  onWarning?: (message: string) => void;
}

export interface GetRankedIssuesOptions {
  profile?: RepoProfile;
  maxIssues?: number;
  maxEvidenceExtraction?: number;
  concurrency?: number;
}

/**
 * Concurrently processes an array of items with a fixed concurrency limit.
 */
async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx]!, idx);
    }
  });

  await Promise.all(workers);
  return results;
}

export class ContribPilotEngine {
  constructor(private events: EngineEvents = {}) {}

  protected async getGitHubService(): Promise<GitHubService> {
    const token =
      (await defaultTokenStore.getApiKey('github')) ||
      process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      undefined;
    return new GitHubService(token);
  }

  private async getLLMProvider(): Promise<LLMProvider> {
    const groqKey = (await defaultTokenStore.getApiKey('groq')) || process.env.GROQ_API_KEY;
    const groqProvider = groqKey ? new GroqProvider(groqKey) : undefined;

    let primaryProvider: LLMProvider | undefined;

    // 1. First priority: Connected Google Account via OAuth (uses user's account Gemini quota)
    const token = await defaultTokenStore.getToken();
    if (token) {
      let activeAccessToken = token.accessToken;
      // Auto-refresh token if near expiration
      if (token.refreshToken && token.expiresAt - Date.now() < 60000) {
        try {
          const authService = new GoogleAuthService();
          const refreshed = await authService.refreshAccessToken(token.refreshToken);
          await defaultTokenStore.setToken(refreshed);
          activeAccessToken = refreshed.accessToken;
        } catch {
          // If refresh fails, continue with existing access token
        }
      }
      primaryProvider = new GoogleGenAIProvider({ oauthToken: activeAccessToken });
    } else {
      // 2. Second priority: Configured Gemini API key (BYOK mode)
      const geminiKey = (await defaultTokenStore.getApiKey('gemini')) || process.env.GEMINI_API_KEY;
      if (geminiKey) {
        primaryProvider = new GoogleGenAIProvider({ apiKey: geminiKey });
      } else {
        // 3. Third priority: ContribPilot Pro / Hosted Gemini Key for paying users
        const isPro = (await defaultTokenStore.isProUser()) || !!process.env.CONTRIBPILOT_PRO_KEY;
        const hostedGeminiKey = process.env.CONTRIBPILOT_HOSTED_GEMINI_KEY;
        if (isPro && hostedGeminiKey) {
          primaryProvider = new GoogleGenAIProvider({ apiKey: hostedGeminiKey });
        }
      }
    }

    // Automatic Failover: When Gemini primary quota is exhausted, seamlessly switch to Groq!
    if (primaryProvider && groqProvider) {
      return new FallbackLLMProvider(primaryProvider, groqProvider, (err) => {
        this.events.onWarning?.(
          `Gemini quota exhausted (${err.message}). Automatically switched to Groq failover.`
        );
      });
    }

    if (primaryProvider) {
      return primaryProvider;
    }

    if (groqProvider) {
      return groqProvider;
    }

    // 4. Fallback: Offline deterministic evaluation
    return new MockLLMProvider();
  }

  async analyzeRepo(repoUrl: string): Promise<RepoProfile> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(
        `Invalid GitHub URL or shorthand: "${repoUrl}". Expected format: https://github.com/owner/repo or owner/repo`
      );
    }

    const github = await this.getGitHubService();
    const analyzer = new StaticCodebaseAnalyzer(github);

    this.events.onProgress?.(`Analyzing repository ${ref.owner}/${ref.name}...`);
    return await analyzer.analyze(ref.owner, ref.name);
  }

  async auditRepo(repoUrl: string): Promise<RepoAuditResult> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(
        `Invalid GitHub URL or shorthand: "${repoUrl}". Expected format: https://github.com/owner/repo or owner/repo`
      );
    }

    const github = await this.getGitHubService();
    const auditor = new RepoHealthAuditor(github);

    this.events.onProgress?.(
      `Auditing ${ref.owner}/${ref.name} for code health, architecture, and secret leaks...`
    );
    return await auditor.audit(ref.owner, ref.name);
  }

  async getRankedIssues(
    repoUrl: string,
    level: Level,
    options?: GetRankedIssuesOptions
  ): Promise<{
    profile: RepoProfile;
    top3: RankedIssue[];
    allRanked?: RankedIssue[];
    totalOpenIssues: number;
    filteredCount: number;
  }> {
    const ref = parseGitHubUrl(repoUrl);
    if (!ref) {
      throw new RepoNotFoundError(`Invalid GitHub URL or shorthand: "${repoUrl}".`);
    }

    const profile = options?.profile || (await this.analyzeRepo(repoUrl));
    const github = await this.getGitHubService();

    const maxIssues = options?.maxIssues ?? 40;
    const concurrency = options?.concurrency ?? 5;

    this.events.onProgress?.(
      `Fetching open issues for ${ref.owner}/${ref.name} (max: ${maxIssues})...`
    );
    const rawIssues = await github.getOpenIssues(ref.owner, ref.name, {
      maxIssues,
      perPage: Math.min(maxIssues, 100),
    });

    const extractionLimit = options?.maxEvidenceExtraction ?? rawIssues.length;
    const targetIssues = rawIssues.slice(0, extractionLimit);

    this.events.onProgress?.(
      `Extracting evidence & checking claims across ${targetIssues.length} issues (concurrency: ${concurrency})...`
    );

    // Extract evidence for issues using controlled concurrency and graceful error recovery
    const evidences = await mapConcurrent(targetIssues, concurrency, async (raw) => {
      try {
        const [comments, timeline] = await Promise.all([
          github.getIssueComments(ref.owner, ref.name, raw.number),
          github.getIssueTimeline(ref.owner, ref.name, raw.number),
        ]);
        return defaultEvidenceExtractor.extractEvidence(raw, comments, timeline);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.events.onWarning?.(
          `Failed to fetch comments/timeline for #${raw.number}: ${msg}. Using basic issue evidence.`
        );
        return defaultEvidenceExtractor.extractEvidence(raw, [], []);
      }
    });

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

    // Strictly match only the requested issue number
    let picked = top3.find((r) => r.issue.number === issueNumber);

    // If requested issue wasn't in top 3 recommendations, try fetching and scoring it specifically
    if (!picked) {
      const github = await this.getGitHubService();
      const rawIssue = await github.getIssue(ref.owner, ref.name, issueNumber);

      if (!rawIssue || rawIssue.state !== 'open') {
        throw new GenericError(
          `Requested issue #${issueNumber} was not found or is closed in ${ref.owner}/${ref.name}. Cannot generate Contribution Pack.`
        );
      }

      this.events.onProgress?.(`Extracting evidence for requested issue #${issueNumber}...`);
      const [comments, timeline] = await Promise.all([
        github.getIssueComments(ref.owner, ref.name, issueNumber),
        github.getIssueTimeline(ref.owner, ref.name, issueNumber),
      ]);

      const evidence = defaultEvidenceExtractor.extractEvidence(rawIssue, comments, timeline);
      const llm = await this.getLLMProvider();
      const ranker = new IssueScorer(llm);

      const ranked = await ranker.rank(level, profile, [evidence]);
      picked = ranked.find((r) => r.issue.number === issueNumber) || {
        issue: evidence,
        score: ranker.computeBaseScore(evidence, level).score,
        breakdown: ranker.computeBaseScore(evidence, level).breakdown,
        fitReason: `Directly targeted issue #${issueNumber} for ${level} level.`,
        risks: ['Evaluate issue scope and verify test coverage before editing.'],
        estimatedEffort:
          level === 'beginner' ? '1-3 hours' : level === 'intermediate' ? '0.5-2 days' : '2+ days',
        likelyFiles: profile.hotspots.map((h) => h.path),
        verifiedFiles: profile.hotspots.map((h) => h.path),
        unverifiedFiles: [],
        mostRecommended: false,
      };
    }

    // Never fall back silently to top3[0]!
    if (!picked || picked.issue.number !== issueNumber) {
      throw new GenericError(
        `Requested issue #${issueNumber} is unavailable in repository ${ref.owner}/${ref.name}. Cannot generate Contribution Pack.`
      );
    }

    const content = defaultPackGenerator.generate({
      level,
      profile,
      rankedIssue: picked,
    });

    const targetDir =
      outDir ||
      path.join(process.cwd(), '.contribpilot', `${ref.owner}-${ref.name}-${picked.issue.number}`);
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
