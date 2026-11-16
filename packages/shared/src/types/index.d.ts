import type { ZodType } from 'zod';
export type Level = 'beginner' | 'intermediate' | 'pro';
export interface RepoProfile {
    owner: string;
    name: string;
    headSha: string;
    languages: Record<string, number>;
    frameworks: string[];
    commands: {
        build?: string;
        test?: string;
        lint?: string;
        dev?: string;
    };
    structure: {
        path: string;
        role: string;
    }[];
    hotspots: {
        path: string;
        reason: string;
    }[];
    todos: {
        path: string;
        line: number;
        text: string;
    }[];
    contributing: {
        hasGuide: boolean;
        aiPolicy: 'allowed' | 'restricted' | 'banned' | 'unknown';
        cla: boolean;
        dco: boolean;
        prTemplate: boolean;
    };
    summary: string;
}
export interface IssueEvidence {
    number: number;
    url: string;
    title: string;
    body?: string;
    labels: string[];
    ageDays: number;
    lastActivityDays: number;
    commentCount: number;
    assignees: string[];
    claims: {
        user: string;
        commentUrl: string;
        ageDays: number;
    }[];
    linkedPRs: {
        number: number;
        state: 'open' | 'closed' | 'merged';
        url: string;
        stale: boolean;
    }[];
    maintainerSignals: {
        maintainerReplied: boolean;
        labeledHelpWanted: boolean;
        triaged: boolean;
    };
    media: {
        type: 'image' | 'video';
        url: string;
        insight?: string;
    }[];
    reproducible: 'yes' | 'no' | 'unknown';
    summary: string;
}
export interface RankedIssue {
    issue: IssueEvidence;
    score: number;
    breakdown: Record<string, number>;
    fitReason: string;
    risks: string[];
    estimatedEffort: string;
    likelyFiles: string[];
    mostRecommended: boolean;
}
export interface LLMProvider {
    generateJson<T>(args: {
        system: string;
        user: string;
        schema: ZodType<T>;
        media?: {
            mime: string;
            data: Buffer;
        }[];
    }): Promise<T>;
}
export interface AgentDetectionResult {
    installed: boolean;
    path?: string;
    version?: string;
}
export interface AgentAdapter {
    id: string;
    displayName: string;
    detect(): Promise<AgentDetectionResult>;
    launch(opts: {
        cwd: string;
        planFile: string;
        prompt: string;
    }): Promise<void>;
}
export type PipelineEvent = {
    type: 'progress';
    stage: string;
    percent?: number;
    message: string;
} | {
    type: 'warning';
    message: string;
    details?: unknown;
} | {
    type: 'result';
    stage: string;
    data: unknown;
};
//# sourceMappingURL=index.d.ts.map