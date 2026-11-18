import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';
import { LLMSchemaError } from '@contribpilot/shared';
import type { LLMProvider } from '@contribpilot/shared';

export interface GoogleGenAIProviderOptions {
  apiKey?: string;
  oauthToken?: string;
  modelName?: string;
}

export class GoogleGenAIProvider implements LLMProvider {
  private oauthToken?: string;
  private modelName: string;
  private ai?: GoogleGenAI;

  constructor(options: string | GoogleGenAIProviderOptions, modelName = 'gemini-2.5-flash') {
    if (typeof options === 'string') {
      this.modelName = modelName;
      this.ai = new GoogleGenAI({ apiKey: options });
    } else {
      this.oauthToken = options.oauthToken;
      this.modelName = options.modelName || modelName;
      if (options.apiKey) {
        this.ai = new GoogleGenAI({ apiKey: options.apiKey });
      }
    }
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

        let rawText = '';

        // Case 1: Authenticated with user's Google OAuth Account Token (uses user's account quota)
        if (this.oauthToken) {
          const parts: any[] = [{ text: fullPrompt }]; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (args.media && args.media.length > 0) {
            for (const m of args.media) {
              parts.push({
                inlineData: {
                  mimeType: m.mime,
                  data: m.data.toString('base64'),
                },
              });
            }
          }

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${this.oauthToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Google Gemini API error (${res.status}): ${errBody}`);
          }

          const jsonRes = (await res.json()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          rawText =
            jsonRes.candidates?.[0]?.content?.parts?.[0]?.text ||
            jsonRes.candidates?.[0]?.text ||
            '{}';
        } else if (this.ai) {
          // Case 2: Using API Key with @google/genai SDK
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

          rawText = response.text || '{}';
        } else {
          throw new Error('No authentication provider configured for Gemini.');
        }

        // Clean possible markdown code fences
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
        const parsed = JSON.parse(cleaned);

        const validation = args.schema.safeParse(parsed);
        if (!validation.success) {
          throw new LLMSchemaError(`Schema validation failed: ${validation.error.message}`);
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
