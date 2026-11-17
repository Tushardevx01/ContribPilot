import type { ZodType } from 'zod';
import type { LLMProvider } from '@contribpilot/shared';

export class FallbackLLMProvider implements LLMProvider {
  constructor(
    private primary: LLMProvider,
    private fallback: LLMProvider,
    private onFallbackTriggered?: (error: Error) => void
  ) {}

  async generateJson<T>(args: {
    system: string;
    user: string;
    schema: ZodType<T>;
    media?: { mime: string; data: Buffer }[];
  }): Promise<T> {
    try {
      return await this.primary.generateJson(args);
    } catch (err: unknown) {
      if (this.isQuotaOrRateLimitError(err)) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        if (this.onFallbackTriggered) {
          this.onFallbackTriggered(errorObj);
        }
        return await this.fallback.generateJson(args);
      }
      throw err;
    }
  }

  private isQuotaOrRateLimitError(err: unknown): boolean {
    const msg = String(err).toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit') ||
      msg.includes('ratelimit') ||
      msg.includes('exceeded') ||
      msg.includes('capacity')
    );
  }
}
