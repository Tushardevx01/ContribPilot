import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';
import { LLMSchemaError } from '@contribpilot/shared';
import type { LLMProvider } from '@contribpilot/shared';

export class GoogleGenAIProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  async generateJson<T>(args: {
    system: string;
    user: string;
    schema: ZodType<T>;
    media?: { mime: string; data: Buffer }[];
  }): Promise<T> {
    let retries = 0;
    let lastError: unknown;

    while (retries <= 2) {
      try {
        const fullPrompt = `${args.system}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. Do not include markdown code block backticks.\n\n${args.user}`;

        const contents: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (args.media && args.media.length > 0) {
          for (const m of args.media) {
            contents.push({
              inlineData: {
                mimeType: m.mime,
                data: m.data.toString('base64'),
              },
            });
          }
        }
        contents.push(fullPrompt);

        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        // Clean possible markdown code fences if model enclosed them
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        const validation = args.schema.safeParse(parsed);
        if (!validation.success) {
          throw new LLMSchemaError(
            `Schema validation failed: ${validation.error.message}`
          );
        }

        return validation.data;
      } catch (err) {
        lastError = err;
        retries++;
      }
    }

    throw new LLMSchemaError(
      `Failed to generate valid JSON schema after 2 retries: ${String(lastError)}`
    );
  }
}
