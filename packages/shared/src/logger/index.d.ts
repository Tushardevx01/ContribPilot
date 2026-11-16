export declare function redactSecrets(text: string): string;
export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
export declare class ConsoleLogger implements Logger {
    private readonly debugEnabled;
    constructor(debugEnabled?: boolean);
    private format;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
export declare const defaultLogger: ConsoleLogger;
//# sourceMappingURL=index.d.ts.map