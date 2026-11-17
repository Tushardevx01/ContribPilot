import type { IssueEvidence } from '@contribpilot/shared';

const CLAIM_REGEX =
  /\b(i('ll| will| would like to| can)?\s*(take|claim|work on|fix|handle)|assign\s+(this\s+to\s+me|me))\b/i;

const IMAGE_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
const HTML_IMG_REGEX = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/g;

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

    const labels: string[] = (issue.labels || []).map((l: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      typeof l === 'string' ? l : l.name || ''
    );

    const assignees: string[] = (issue.assignees || []).map((a: any) => a.login || ''); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (issue.user && assignees.length === 0 && issue.assignee) {
      assignees.push(issue.assignee.login);
    }

    // 1. Detect claims in comments
    const claims: { user: string; commentUrl: string; ageDays: number }[] = [];
    for (const comment of comments) {
      const body = comment.body || '';
      if (CLAIM_REGEX.test(body)) {
        const commentTime = new Date(comment.created_at).getTime();
        claims.push({
          user: comment.user?.login || 'unknown',
          commentUrl: comment.html_url || '',
          ageDays: Math.max(0, Math.floor((now - commentTime) / (1000 * 60 * 60 * 24))),
        });
      }
    }

    // 2. Detect linked PRs from timeline
    const linkedPRs: { number: number; state: 'open' | 'closed' | 'merged'; url: string; stale: boolean }[] = [];
    for (const event of timeline) {
      if (event.event === 'cross-referenced' && event.source?.issue?.pull_request) {
        const pr = event.source.issue;
        const prUpdatedTime = new Date(pr.updated_at || pr.created_at).getTime();
        const prAgeDays = Math.max(0, Math.floor((now - prUpdatedTime) / (1000 * 60 * 60 * 24)));
        const isMerged = !!pr.pull_request?.merged_at;
        const state: 'open' | 'closed' | 'merged' = isMerged ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';

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

    const triaged = labels.some((l) => /triage|accepted|confirmed|bug|enhancement/i.test(l)) || maintainerReplied;

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
    const hasReproSection = /steps\s+to\s+reproduce|reproduction|repro\b|how\s+to\s+reproduce/i.test(
      issue.body || ''
    );
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
