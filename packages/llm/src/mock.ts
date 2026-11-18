import type { ZodType } from 'zod';
import type { LLMProvider } from '@contribpilot/shared';

export class MockLLMProvider implements LLMProvider {
  constructor(private customHandler?: (prompt: string) => any) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async generateJson<T>(args: { system: string; user: string; schema: ZodType<T> }): Promise<T> {
    if (this.customHandler) {
      const result = this.customHandler(args.user);
      return args.schema.parse(result);
    }

    // Default mock response based on common schemas
    const defaultData = {
      fitScore: 8,
      fitReason: 'Well-scoped issue matching level prerequisites with reproducible behavior.',
      risks: ['Requires verifying cross-platform test execution.'],
      effort: '2-3 hours',
      likelyFiles: ['src/index.ts'],
      summary: 'Mock analyzed issue summary.',
    };

    return args.schema.parse(defaultData);
  }
}
