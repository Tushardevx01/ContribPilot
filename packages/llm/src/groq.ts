import type { ZodType } from 'zod';
import { LLMSchemaError } from '@contribpilot/shared';
import type { LLMProvider } from '@contribpilot/shared';

export interface GroqProviderOptions {
  apiKey: string;
  modelName?: string;
}

export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private modelName: string;

  constructor(options: string | GroqProviderOptions, modelName = 'llama-3.3-70b-versatile') {
    if (typeof options === 'string') {
      this.apiKey = options;
      this.modelName = modelName;
    } else {
      this.apiKey = options.apiKey;
      this.modelName = options.modelName || modelName;
    }
  }

  async generateJson<T>(args: {
    system: string;
    user: string;
    schema: ZodType<T>;
    media?: { mime: string; data: Buffer }[];
  }): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fullPrompt = `${args.system}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema.\n\n${args.user}`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI code analyst. Always respond strictly in valid JSON matching the requested schema without markdown backticks.',
              },
              { role: 'user', content: fullPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Groq API error (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };

        const rawText = data.choices?.[0]?.message?.content || '{}';
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        const validation = args.schema.safeParse(parsed);
        if (!validation.success) {
          throw new LLMSchemaError(
            `Groq output failed schema validation: ${validation.error.message}`
          );
        }

        return validation.data;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('Groq generation failed after retry');
  }
}
