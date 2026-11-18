import type { IssueEvidence } from '@contribpilot/shared';

// High-confidence explicit claim: direct assignment requests or explicit commitments
const HIGH_CONFIDENCE_CLAIM_REGEX =
  /\b((?:please\s+)?assign\s+(?:(?:this\s+)?to\s+me|me)|i(?:'d|\s+would)?\s+like\s+to\s+(?:work\s+on|fix|take|handle)\s+this|i\s+am\s+(?:currently\s+)?working\s+on\s+(?:this|a\s+pr|a\s+fix)|(?:opening|submitting)\s+a\s+pr\s+(?:soon|today|shortly))\b/i;

// Medium-confidence claim: offers to help or work
const MEDIUM_CONFIDENCE_CLAIM_REGEX =
  /\b(i(?:'ll|\s+will|\s+can)\s*(?:take|claim|work\s+on|fix|handle)|can\s+i\s+(?:take|claim|work\s+on|fix|handle))\b/i;

// Historical statements: discussing past work, not current intent
const HISTORICAL_STATEMENT_REGEX =
  /\b(i\s+(?:was|tried\s+to|worked\s+on|attempted\s+to|used\s+to|had)\s+(?:work\s+on|fix|take|handle|investigate)|(?:in\s+the\s+past|years?\s+ago|months?\s+ago|previously\s+worked))\b/i;

// Questions addressed to others
const THIRD_PARTY_QUESTION_REGEX =
  /\b(can\s+(?:someone|anybody|anyone)|who\s+is\s+working|is\s+anyone\s+(?:working|fixing|taking))\b/i;

// Unassignment, stepping back, or abandonment
const UNASSIGN_ABANDON_REGEX =
  /\b(can'?t|cannot|won'?t|not\s+(?:able|going\s+to|working)|unassign\s+me|no\s+longer\s+working|abandon(?:ing)?|give\s+up|giving\s+up|step(?:ping)?\s+back|drop(?:ping)?\s+this|free\s+to\s+take)\b/i;

const IMAGE_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
const HTML_IMG_REGEX = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/g;

/**
 * Strips markdown blockquote lines (> ...) so quotes from previous commenters
 * are not falsely attributed to the replying user.
 */
function stripBlockquotes(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n');
}

export class EvidenceExtractor {
  extractEvidence(
    issue: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    comments: any[] = [], // eslint-disable-line @typescript-eslint/no-explicit-any
    timeline: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
  ): IssueEvidence {
    const now = Date.now();
    const createdTime = new Date(issue.created_at).getTime();
    const updatedTime = new Date(issue.updated_at).getTime();

    const ageDays = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)));
    const lastActivityDays = Math.max(0, Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24)));

    const labels: string[] = (issue.labels || []).map((l: { name?: string } | string) =>
      typeof l === 'string' ? l : l.name || ''
    );

    const assignees: string[] = (issue.assignees || []).map(
      (a: { login?: string }) => a.login || ''
    );
    if (issue.user && assignees.length === 0 && issue.assignee) {
      assignees.push(issue.assignee.login);
    }

    // 1. Context-aware claim detection in comments
    const claimsByUser = new Map<
      string,
      {
        user: string;
        commentUrl: string;
        ageDays: number;
        confidence: 'high' | 'medium' | 'low';
        status: 'active' | 'stale' | 'abandoned';
      }
    >();

    for (const comment of comments) {
      const rawBody = comment.body || '';
      const user = comment.user?.login || 'unknown';
      const commentTime = new Date(comment.created_at).getTime();
      const commentAgeDays = Math.max(0, Math.floor((now - commentTime) / (1000 * 60 * 60 * 24)));
      const commentUrl = comment.html_url || '';

      // Strip quoted lines to avoid false-positive attribution
      const cleanBody = stripBlockquotes(rawBody);

      // Check if user is stepping back or unassigning
      if (UNASSIGN_ABANDON_REGEX.test(cleanBody)) {
        if (claimsByUser.has(user)) {
          const existing = claimsByUser.get(user)!;
          existing.status = 'abandoned';
        }
        continue;
      }

      // Check if it's a historical statement ("I worked on this 6 months ago")
      if (HISTORICAL_STATEMENT_REGEX.test(cleanBody)) {
        continue;
      }

      // Check if it's a question directed to someone else ("Can anyone fix this?")
      if (THIRD_PARTY_QUESTION_REGEX.test(cleanBody)) {
        continue;
      }

      let confidence: 'high' | 'medium' | 'low' | null = null;
      if (HIGH_CONFIDENCE_CLAIM_REGEX.test(cleanBody)) {
        confidence = 'high';
      } else if (MEDIUM_CONFIDENCE_CLAIM_REGEX.test(cleanBody)) {
        confidence = 'medium';
      }

      if (confidence) {
        // Determine status based on age
        const status: 'active' | 'stale' = commentAgeDays > 14 ? 'stale' : 'active';
        claimsByUser.set(user, {
          user,
          commentUrl,
          ageDays: commentAgeDays,
          confidence,
          status,
        });
      }
    }

    const claims = Array.from(claimsByUser.values());

    // 2. Detect linked PRs from timeline
    const linkedPRs: {
      number: number;
      state: 'open' | 'closed' | 'merged';
      url: string;
      stale: boolean;
    }[] = [];
    for (const event of timeline) {
      if (event.event === 'cross-referenced' && event.source?.issue?.pull_request) {
        const pr = event.source.issue;
        const prUpdatedTime = new Date(pr.updated_at || pr.created_at).getTime();
        const prAgeDays = Math.max(0, Math.floor((now - prUpdatedTime) / (1000 * 60 * 60 * 24)));
        const isMerged = !!pr.pull_request?.merged_at;
        const state: 'open' | 'closed' | 'merged' = isMerged
          ? 'merged'
          : pr.state === 'closed'
            ? 'closed'
            : 'open';

        linkedPRs.push({
          number: pr.number,
          state,
          url: pr.html_url,
          stale: prAgeDays > 30,
        });
      }
    }

    // 3. Maintainer signals
    const maintainerReplied = comments.some((c) => {
      const assoc = c.author_association;
      return assoc === 'OWNER' || assoc === 'MEMBER' || assoc === 'COLLABORATOR';
    });

    const labeledHelpWanted = labels.some((l) =>
      /help\s*wanted|good\s*first\s*issue|contributions\s*welcome/i.test(l)
    );

    const triaged =
      labels.some((l) => /triage|accepted|confirmed|bug|enhancement/i.test(l)) || maintainerReplied;

    // 4. Media detection (screenshots / screen recordings in markdown)
    const media: { type: 'image' | 'video'; url: string; insight?: string }[] = [];
    const textToScan = `${issue.body || ''} ${comments.map((c) => c.body || '').join(' ')}`;

    let match: RegExpExecArray | null;
    while ((match = IMAGE_REGEX.exec(textToScan)) !== null) {
      const url = match[2];
      if (url) {
        media.push({
          type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'video' : 'image',
          url,
        });
      }
    }

    while ((match = HTML_IMG_REGEX.exec(textToScan)) !== null) {
      const url = match[1];
      if (url && !media.some((m) => m.url === url)) {
        media.push({
          type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'video' : 'image',
          url,
        });
      }
    }

    // 5. Reproducibility estimation
    const hasReproSection =
      /steps\s+to\s+reproduce|reproduction|repro\b|how\s+to\s+reproduce/i.test(issue.body || '');
    const reproducible = hasReproSection ? 'yes' : 'unknown';

    return {
      number: issue.number,
      url: issue.html_url,
      title: issue.title,
      body: issue.body || '',
      labels,
      ageDays,
      lastActivityDays,
      commentCount: comments.length,
      assignees,
      claims,
      linkedPRs,
      maintainerSignals: {
        maintainerReplied,
        labeledHelpWanted,
        triaged,
      },
      media,
      reproducible,
      summary: issue.body ? issue.body.slice(0, 200).replace(/\r?\n/g, ' ') : issue.title,
    };
  }
}

export const defaultEvidenceExtractor = new EvidenceExtractor();
