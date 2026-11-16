export abstract class ContribPilotError extends Error {
  abstract readonly exitCode: number;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GenericError extends ContribPilotError {
  readonly exitCode = 1;
}

export class AuthError extends ContribPilotError {
  readonly exitCode = 2;
}

export class RateLimitError extends ContribPilotError {
  readonly exitCode = 3;
  constructor(
    message: string,
    public readonly resetTime?: Date
  ) {
    super(message);
  }
}

export class RepoNotFoundError extends ContribPilotError {
  readonly exitCode = 4;
}

export class LLMSchemaError extends ContribPilotError {
  readonly exitCode = 5;
}

export class PolicyBlockedError extends ContribPilotError {
  readonly exitCode = 6;
}
