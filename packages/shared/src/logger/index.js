const REDACTION_PATTERNS = [
    /gho_[A-Za-z0-9_]{30,}/g,
    /ghp_[A-Za-z0-9_]{30,}/g,
    /github_pat_[A-Za-z0-9_]{30,}/g,
    /AIza[0-9A-Za-z-_]{35}/g,
    /ya29\.[0-9A-Za-z-_]+/g,
    /Bearer\s+[A-Za-z0-9-_.]+/gi,
];
export function redactSecrets(text) {
    let cleaned = text;
    for (const pattern of REDACTION_PATTERNS) {
        cleaned = cleaned.replace(pattern, '[REDACTED_SECRET]');
    }
    return cleaned;
}
export class ConsoleLogger {
    debugEnabled;
    constructor(debugEnabled = false) {
        this.debugEnabled = debugEnabled;
    }
    format(level, message, args) {
        const raw = `${message} ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}`.trim();
        return `[${level.toUpperCase()}] ${redactSecrets(raw)}`;
    }
    debug(message, ...args) {
        if (this.debugEnabled) {
            console.debug(this.format('debug', message, args));
        }
    }
    info(message, ...args) {
        console.info(this.format('info', message, args));
    }
    warn(message, ...args) {
        console.warn(this.format('warn', message, args));
    }
    error(message, ...args) {
        console.error(this.format('error', message, args));
    }
}
export const defaultLogger = new ConsoleLogger(process.env.DEBUG === 'true' || process.env.DEBUG === '1');
//# sourceMappingURL=index.js.map