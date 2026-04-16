import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { LlmResult, ToolCall, ToolDefinition } from '../groq/groq.service';

@Injectable()
export class OpenAIService {
  private client: OpenAI;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Non-streaming tool-capable call. Matches the GroqService contract so the
   * model router can treat the two providers interchangeably.
   */
  async generateWithTools(params: {
    systemPrompt: string;
    userMessage: string;
    tools?: ToolDefinition[];
  }): Promise<LlmResult> {
    const resp = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      temperature: 0.85,
      max_tokens: 1024,
      tools: params.tools?.length ? (params.tools as any) : undefined,
      tool_choice: params.tools?.length ? 'auto' : undefined,
    } as any);

    const message: any = (resp as any).choices?.[0]?.message ?? {};
    const toolCalls: ToolCall[] = Array.isArray(message.tool_calls)
      ? message.tool_calls
          .filter((t: any) => t?.type === 'function' && t.function?.name)
          .map((t: any) => ({
            id: t.id,
            name: t.function.name,
            arguments: safeParseJson(t.function.arguments),
          }))
      : [];

    return {
      content: typeof message.content === 'string' ? message.content : '',
      toolCalls,
    };
  }

  async *streamResponse(params: {
    systemPrompt: string;
    userMessage: string;
  }) {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

function safeParseJson(input: unknown): Record<string, any> {
  if (input && typeof input === 'object') return input as Record<string, any>;
  if (typeof input !== 'string') return {};
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}
