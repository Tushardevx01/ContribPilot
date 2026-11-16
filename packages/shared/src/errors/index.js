export class ContribPilotError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class GenericError extends ContribPilotError {
    exitCode = 1;
}
export class AuthError extends ContribPilotError {
    exitCode = 2;
}
export class RateLimitError extends ContribPilotError {
    resetTime;
    exitCode = 3;
    constructor(message, resetTime) {
        super(message);
        this.resetTime = resetTime;
    }
}
export class RepoNotFoundError extends ContribPilotError {
    exitCode = 4;
}
export class LLMSchemaError extends ContribPilotError {
    exitCode = 5;
}
export class PolicyBlockedError extends ContribPilotError {
    exitCode = 6;
}
//# sourceMappingURL=index.js.map