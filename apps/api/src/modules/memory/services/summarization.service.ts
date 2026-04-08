import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class SummarizationService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  async summarize(messages: Message[]): Promise<string> {
    if (messages.length === 0) {
      return '';
    }

    // Format messages for summarization
    const conversation = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that creates concise summaries of conversations. 
Create a summary that captures:
1. Key topics discussed
2. Important information shared
3. User's preferences or interests mentioned
4. Emotional tone or context

Keep the summary under 200 words and focus on information that would be helpful for future conversations.`,
          },
          {
            role: 'user',
            content: `Please summarize this conversation:\n\n${conversation}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async summarizeWithContext(messages: Message[], previousContext?: string): Promise<string> {
    if (messages.length === 0) {
      return previousContext || '';
    }

    const conversation = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = previousContext
      ? `Previous context:\n${previousContext}\n\nNew conversation:\n${conversation}\n\nCreate an updated summary that incorporates both the previous context and new conversation.`
      : `Summarize this conversation:\n\n${conversation}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that creates concise summaries of conversations.
Focus on key information, user preferences, and important context for future conversations.
Keep summaries under 200 words.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating summary with context:', error);
      throw new Error('Failed to generate summary');
    }
  }
}
