export type FaqEntry = { q: string; a: string };

export const FAQ_ITEMS: readonly FaqEntry[] = [
  {
    q: 'Is this for me?',
    a: "It's for anyone who's ever wanted to talk to someone without explaining themselves first.",
  },
  {
    q: 'Can I try without paying?',
    a: 'Yes. Start with her. No card. No commitments.',
  },
  {
    q: 'Is what we say private?',
    a: "What you share stays with you. Your conversations aren't traded, sold, or learned from outside of yours.",
  },
  {
    q: 'Can I switch between different companions?',
    a: "Whenever you want. Each one is her own. She won't hold it against you.",
  },
] as const;
