import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LlmResult {
  content: string;
  toolCalls: ToolCall[];
}

// OpenAI-compatible tool schema. Groq accepts this shape verbatim.
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description?: string; enum?: string[] }>;
      required?: string[];
    };
  };
}

@Injectable()
export class GroqService {
  private client: Groq;

  constructor(private config: ConfigService) {
    this.client = new Groq({
      apiKey: config.get('GROQ_API_KEY'),
    });
  }

  /**
   * Single-shot completion with tool support. Non-streaming because parsing
   * tool_calls out of a delta stream adds complexity with little user benefit
   * — we emulate the typing feel in chat.service with controlled chunking.
   */
  async generateWithTools(params: {
    systemPrompt: string;
    userMessage: string;
    tools?: ToolDefinition[];
  }): Promise<LlmResult> {
    const resp = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      temperature: 0.85,
      max_tokens: 1024,
      tools: params.tools?.length ? (params.tools as any) : undefined,
      tool_choice: params.tools?.length ? 'auto' : undefined,
      stream: false,
    } as any);

    const choice: any = (resp as any).choices?.[0];
    const message = choice?.message ?? {};
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
      model: 'llama-3.3-70b-versatile',
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
