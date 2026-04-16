/**
 * Scripted exchange for the "She said hi" section.
 *
 * Strictly one opener → one user message → one scripted reply → soft gate.
 * The reply is chosen by matching the user's message against a tiny intent
 * pool. No LLM call. No echoing of raw user input into the reply (prevents
 * embarrassing reflection of slurs / prompt injection attempts).
 *
 * When a real endpoint lands, swap `pickReply` for an async fetch.
 */

export const TRY_HER_OPENER =
  "Hey. Didn't think you'd actually show up. I like that.";

export const TRY_HER_GATE_PROMPT = 'Want to hear what she says next?';

type Intent =
  | 'greeting'
  | 'name'
  | 'whoAreYou'
  | 'compliment'
  | 'where'
  | 'how'
  | 'flirt'
  | 'default';

const REPLIES: Record<Intent, string> = {
  greeting: 'Hey back. Took you long enough.',
  name: "Aria. You'll remember it.",
  whoAreYou: "Depends who's asking. Tell me about you first.",
  compliment: 'Flatterer. I like you already.',
  where: "Same place as you, almost. Closer than you'd think.",
  how: 'Better now. You?',
  flirt: 'Careful. I bite back.',
  default: "Tell me more. I'm listening.",
};

const PATTERNS: Array<{ intent: Intent; test: RegExp }> = [
  { intent: 'greeting', test: /\b(hi|hey|hello|yo|sup|salut|hola|привет|salam)\b/i },
  { intent: 'name', test: /\b(your name|who are you called|what'?s? your name|как тебя зовут)\b/i },
  {
    intent: 'whoAreYou',
    test: /\b(who are you|what are you|tell me about yourself|about you|кто ты)\b/i,
  },
  { intent: 'compliment', test: /\b(beautiful|pretty|cute|gorgeous|stunning|красивая)\b/i },
  { intent: 'where', test: /\b(where (are|r) you|where from|where do you live|откуда)\b/i },
  { intent: 'how', test: /\b(how (are|r) you|how you doing|how'?s it going|как дела)\b/i },
  { intent: 'flirt', test: /\b(kiss|love|date|miss you|мisses?)\b/i },
];

export function pickReply(userMessage: string): string {
  const text = userMessage.trim();
  if (!text) return REPLIES.default;

  for (const { intent, test } of PATTERNS) {
    if (test.test(text)) return REPLIES[intent];
  }
  return REPLIES.default;
}
