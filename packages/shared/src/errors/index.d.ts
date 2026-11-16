export declare abstract class ContribPilotError extends Error {
    abstract readonly exitCode: number;
    constructor(message: string);
}
export declare class GenericError extends ContribPilotError {
    readonly exitCode = 1;
}
export declare class AuthError extends ContribPilotError {
    readonly exitCode = 2;
}
export declare class RateLimitError extends ContribPilotError {
    readonly resetTime?: Date | undefined;
    readonly exitCode = 3;
    constructor(message: string, resetTime?: Date | undefined);
}
export declare class RepoNotFoundError extends ContribPilotError {
    readonly exitCode = 4;
}
export declare class LLMSchemaError extends ContribPilotError {
    readonly exitCode = 5;
}
export declare class PolicyBlockedError extends ContribPilotError {
    readonly exitCode = 6;
}
//# sourceMappingURL=index.d.ts.map