interface SliderProps {
  leftLabel: string;
  rightLabel: string;
  value: number;
}

function Slider({ leftLabel, rightLabel, value }: SliderProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-xs text-gray-500 shrink-0">
        {leftLabel}
      </span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full relative">
        <div
          className="absolute inset-y-0 left-0 bg-purple-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-purple-400 border-2 border-gray-900"
          style={{ left: `${pct}%`, marginLeft: '-7px' }}
        />
      </div>
      <span className="w-20 text-xs text-gray-500 shrink-0">{rightLabel}</span>
    </div>
  );
}

function describeTraits(values: PersonalityValues): string {
  const traits: Array<[number, string, string]> = [
    [values.warmth, 'cool', 'warm'],
    [values.playfulness, 'grave', 'playful'],
  ];

  const descriptions = traits.map(([val, left, right]) => {
    if (val <= 20) return `very ${left}`;
    if (val <= 40) return `somewhat ${left}`;
    if (val <= 60) return 'balanced';
    if (val <= 80) return `somewhat ${right}`;
    return `very ${right}`;
  });

  const notable = descriptions.filter((d) => d !== 'balanced');
  if (notable.length === 0) return 'A balanced blend of warmth and play.';

  const formatted = notable.map(
    (d) => d.charAt(0).toUpperCase() + d.slice(1),
  );
  return formatted.join(', ') + '.';
}

export interface PersonalityValues {
  warmth: number;
  playfulness: number;
}

interface PersonalitySlidersProps {
  values: PersonalityValues;
}

export function PersonalitySliders({ values }: PersonalitySlidersProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Personality
      </h3>
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 space-y-4">
        <Slider leftLabel="Cool" rightLabel="Warm" value={values.warmth} />
        <Slider
          leftLabel="Grave"
          rightLabel="Playful"
          value={values.playfulness}
        />
        <p className="text-xs text-gray-500 italic pt-1 border-t border-gray-700/40">
          {describeTraits(values)}
        </p>
      </div>
    </div>
  );
}
