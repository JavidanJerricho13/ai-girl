export type LandingCharacter = {
  id: string;
  name: string;
  tagline: string;
  intro: string;
  moods: readonly string[];
  portrait: string;
  accent: {
    glow: string;
    edge: string;
  };
  voiceSrc?: string | null;
};

// TODO: replace with ISR fetch from /characters?limit=8&isPublic=true once
// real character data + distinct portraits are ready. For now, three moods
// share the same placeholder portrait per product direction.
export const LANDING_CHARACTERS: readonly LandingCharacter[] = [
  {
    id: 'luna',
    name: 'Luna',
    tagline: 'Quiet nights, long talks.',
    intro:
      'She likes the rain and keeps a notebook by the bed. Ask her about the dream she had last night — she remembers all of them.',
    moods: ['mysterious', 'soft-spoken', 'deep'],
    portrait: '/landing/characters/01-blue.webp',
    accent: {
      glow: '139 127 255', // lilac
      edge: '82 72 180',
    },
    voiceSrc: null,
  },
  {
    id: 'aria',
    name: 'Aria',
    tagline: 'Sunlight, honey, trouble.',
    intro:
      'The kind of warmth you feel through the screen. She laughs first, teases you for it, and then makes you laugh back.',
    moods: ['playful', 'warm', 'bold'],
    portrait: '/landing/characters/02-warm.webp',
    accent: {
      glow: '232 180 160', // rose
      edge: '180 120 95',
    },
    voiceSrc: null,
  },
  {
    id: 'nyx',
    name: 'Nyx',
    tagline: 'Velvet and electricity.',
    intro:
      'Late-night philosopher, early-morning poet. She listens more than she speaks, and when she speaks, you stay.',
    moods: ['intense', 'curious', 'tender'],
    portrait: '/landing/characters/03-violet.webp',
    accent: {
      glow: '210 150 255',
      edge: '130 75 190',
    },
    voiceSrc: null,
  },
] as const;
