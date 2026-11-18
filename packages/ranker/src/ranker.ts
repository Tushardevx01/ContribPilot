import type {
  Level,
  RepoProfile,
  IssueEvidence,
  RankedIssue,
  LLMProvider,
} from '@contribpilot/shared';
import { z } from 'zod';
import { wrapUntrusted } from '@contribpilot/llm';

const LLMJudgeSchema = z.object({
  fitScore: z.number().min(0).max(10),
  fitReason: z.string(),
  risks: z.array(z.string()),
  effort: z.string(),
  likelyFiles: z.array(z.string()),
});

type LLMJudgeResult = z.infer<typeof LLMJudgeSchema>;

interface ScoreBreakdown {
  mergeLikelihood: number;
  levelFit: number;
  clarity: number;
  impact: number;
  freshness: number;
  scope: number;
  penalties: number;
  [key: string]: number;
}

/**
 * Normalizes a repository path for consistent comparison.
 */
export function normalizeRepoPath(filePath: string): string {
  return filePath
    .trim()
    .replace(/^[./\\]+/, '')
    .replace(/\\/g, '/');
}

/**
 * Validates suggested file paths against known repository files.
 * Clearly separates verified existing repository files from speculative AI hypotheses.
 */
export function validateSuggestedFiles(
  suggestedFiles: string[],
  knownFiles: string[] = []
): { verified: string[]; unverified: string[] } {
  const verified: string[] = [];
  const unverified: string[] = [];

  const normalizedKnown = new Set(knownFiles.map(normalizeRepoPath));

  for (const rawPath of suggestedFiles) {
    const cleanPath = normalizeRepoPath(rawPath);
    if (!cleanPath) continue;

    // Check exact file match
    if (normalizedKnown.has(cleanPath)) {
      if (!verified.includes(cleanPath)) verified.push(cleanPath);
      continue;
    }

    // Check directory prefix match (if AI suggested a valid directory)
    const isKnownDir = knownFiles.some((k) => {
      const normK = normalizeRepoPath(k);
      return normK.startsWith(cleanPath.endsWith('/') ? cleanPath : cleanPath + '/');
    });

    if (isKnownDir) {
      if (!verified.includes(cleanPath)) verified.push(cleanPath);
      continue;
    }

    if (!unverified.includes(cleanPath)) unverified.push(cleanPath);
  }

  return { verified, unverified };
}

export class IssueScorer {
  constructor(private llm?: LLMProvider) {}

  filterIssues(
    issues: IssueEvidence[],
    repoBansAI = false,
    allowAIBanned = false
  ): { passed: IssueEvidence[]; filteredCount: number } {
    let filteredCount = 0;
    const passed = issues.filter((issue) => {
      // 1. Label checks
      const hasBadLabel = issue.labels.some((l) =>
        /wontfix|duplicate|invalid|question|wont-fix|declined/i.test(l)
      );
      if (hasBadLabel) {
        filteredCount++;
        return false;
      }

      // 2. Active open PR
      const hasActivePR = issue.linkedPRs.some((pr) => pr.state === 'open' && !pr.stale);
      if (hasActivePR) {
        filteredCount++;
        return false;
      }

      // 3. Active claim (< 14 days) or assigned (ignore abandoned, stale, or low-confidence claims)
      const hasActiveClaim = issue.claims.some((c) => {
        if (c.status === 'abandoned') return false;
        if (c.status === 'stale') return false;
        if (c.confidence === 'low') return false;
        return c.ageDays < 14;
      });

      if (hasActiveClaim || (issue.assignees && issue.assignees.length > 0)) {
        filteredCount++;
        return false;
      }

      // 4. AI policy
      if (repoBansAI && !allowAIBanned) {
        filteredCount++;
        return false;
      }

      return true;
    });

    return { passed, filteredCount };
  }

  computeBaseScore(
    issue: IssueEvidence,
    level: Level
  ): { score: number; breakdown: ScoreBreakdown } {
    let mergeLikelihood = 0;
    let levelFit = 0;
    let clarity = 0;
    let impact = 0;
    let freshness = 0;
    let scope = 0;
    let penalties = 0;

    // Merge likelihood (max 25)
    if (issue.maintainerSignals.maintainerReplied) mergeLikelihood += 12;
    if (issue.maintainerSignals.labeledHelpWanted) mergeLikelihood += 10;
    if (issue.maintainerSignals.triaged) mergeLikelihood += 3;

    // Level fit (max 25)
    const isDocOrTest = issue.labels.some((l) => /doc|documentation|test|testing|example/i.test(l));
    const isGoodFirst = issue.maintainerSignals.labeledHelpWanted;
    const isBug = issue.labels.some((l) => /bug|fix|error|crash/i.test(l));
    const isFeature = issue.labels.some((l) => /feature|enhancement|feat/i.test(l));
    const isComplex = issue.labels.some((l) =>
      /perf|performance|architecture|concurrency|security/i.test(l)
    );

    if (level === 'beginner') {
      if (isGoodFirst || isDocOrTest) levelFit += 25;
      else if (isBug && !isComplex) levelFit += 18;
      else if (isFeature) levelFit += 10;
      else levelFit += 5;
    } else if (level === 'intermediate') {
      if (isBug && !isComplex) levelFit += 25;
      else if (isFeature && !isComplex) levelFit += 22;
      else if (isDocOrTest) levelFit += 12;
      else if (isComplex) levelFit += 15;
      else levelFit += 15;
    } else {
      // Pro
      if (isComplex) levelFit += 25;
      else if (isFeature) levelFit += 20;
      else if (isBug) levelFit += 18;
      else levelFit += 8;
    }

    // Clarity (max 15)
    if (issue.reproducible === 'yes') clarity += 8;
    if (issue.media.length > 0) clarity += 4;
    if (issue.body && issue.body.length > 150) clarity += 3;

    // Impact / Need (max 15)
    if (isBug) impact += 8;
    if (issue.labels.some((l) => /priority|critical|high/i.test(l))) impact += 5;
    if (issue.commentCount > 1) impact += 2;

    // Freshness & Liveness (max 10)
    if (issue.lastActivityDays < 14) freshness += 10;
    else if (issue.lastActivityDays < 30) freshness += 7;
    else if (issue.lastActivityDays < 60) freshness += 4;
    else freshness += 2;

    // Scope containment (max 10)
    scope += level === 'beginner' ? 8 : 10;

    // Penalties
    const hasStalePR = issue.linkedPRs.some((pr) => pr.state === 'open' && pr.stale);
    if (hasStalePR) penalties -= 15;
    if (issue.labels.some((l) => /needs\s*discussion|discussion/i.test(l))) penalties -= 10;

    const totalRaw = mergeLikelihood + levelFit + clarity + impact + freshness + scope + penalties;
    const score = Math.max(0, Math.min(100, totalRaw));

    const breakdown: ScoreBreakdown = {
      mergeLikelihood,
      levelFit,
      clarity,
      impact,
      freshness,
      scope,
      penalties,
    };

    return { score, breakdown };
  }

  async rank(level: Level, profile: RepoProfile, issues: IssueEvidence[]): Promise<RankedIssue[]> {
    const isBanned = profile.contributing.aiPolicy === 'banned';
    const { passed } = this.filterIssues(issues, isBanned, false);

    const scoredList: {
      issue: IssueEvidence;
      baseScore: number;
      breakdown: ScoreBreakdown;
    }[] = [];

    for (const issue of passed) {
      const { score, breakdown } = this.computeBaseScore(issue, level);
      scoredList.push({ issue, baseScore: score, breakdown });
    }

    // Sort by base score descending
    scoredList.sort((a, b) => b.baseScore - a.baseScore);

    // Pick top candidates to evaluate with LLM
    const topCandidates = scoredList.slice(0, 5);
    const rankedIssues: RankedIssue[] = [];

    const repoKnownFiles =
      profile.files && profile.files.length > 0
        ? profile.files
        : profile.hotspots.map((h) => h.path);

    for (let i = 0; i < topCandidates.length; i++) {
      const item = topCandidates[i]!;
      let fitReason = `Good match for ${level} level. Well-scoped with maintainer interest.`;
      let risks: string[] = ['Check existing test coverage before editing.'];
      let estimatedEffort =
        level === 'beginner' ? '1-3 hours' : level === 'intermediate' ? '0.5-2 days' : '2+ days';
      let likelyFiles: string[] = profile.hotspots.map((h) => h.path);
      let verifiedFiles: string[] = profile.hotspots.map((h) => h.path);
      let unverifiedFiles: string[] = [];
      let adjustedScore = item.baseScore;

      if (this.llm) {
        try {
          const prompt = `Analyze this GitHub issue for a ${level} developer.\nRepository: ${profile.owner}/${profile.name}\n${wrapUntrusted('issue_title', item.issue.title)}\n${wrapUntrusted('issue_body', item.issue.body || '')}`;
          const res = await this.llm.generateJson<LLMJudgeResult>({
            system:
              'You are an expert open-source triage engineer. Evaluate issue fit and return JSON with fitScore (0-10), fitReason, risks (array), effort, and likelyFiles.',
            user: prompt,
            schema: LLMJudgeSchema,
          });

          // LLM adjustment capped to +/- 10 points
          const delta = (res.fitScore - 5) * 2;
          adjustedScore = Math.max(0, Math.min(100, Math.round(item.baseScore + delta)));
          fitReason = res.fitReason;
          risks = res.risks;
          estimatedEffort = res.effort;

          if (res.likelyFiles && res.likelyFiles.length > 0) {
            if (repoKnownFiles.length > 0) {
              const validation = validateSuggestedFiles(res.likelyFiles, repoKnownFiles);
              verifiedFiles = validation.verified;
              unverifiedFiles = validation.unverified;

              if (verifiedFiles.length > 0) {
                likelyFiles = verifiedFiles;
              } else {
                // All AI suggested files were non-existent in repo; keep hotspots and flag unverified paths
                likelyFiles = profile.hotspots.map((h) => h.path);
              }

              if (unverifiedFiles.length > 0) {
                risks.push(
                  `AI-suggested paths do not exist in repo tree: ${unverifiedFiles.join(', ')}`
                );
              }
            } else {
              likelyFiles = res.likelyFiles.map(normalizeRepoPath);
              unverifiedFiles = [...likelyFiles];
            }
          }
        } catch {
          // If LLM fails, continue with base score deterministically
        }
      }

      rankedIssues.push({
        issue: item.issue,
        score: adjustedScore,
        breakdown: item.breakdown,
        fitReason,
        risks,
        estimatedEffort,
        likelyFiles,
        verifiedFiles: verifiedFiles.length > 0 ? verifiedFiles : likelyFiles,
        unverifiedFiles,
        mostRecommended: false,
      });
    }

    // Sort by final score
    rankedIssues.sort((a, b) => b.score - a.score);

    // Pick top 3 and mark highest as MOST RECOMMENDED
    const finalTop3 = rankedIssues.slice(0, 3);
    if (finalTop3.length > 0 && finalTop3[0]) {
      finalTop3[0].mostRecommended = true;
    }

    return finalTop3;
  }
}
