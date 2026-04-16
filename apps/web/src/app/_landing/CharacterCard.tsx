'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useGaze } from './hooks/useGaze';
import type { LandingCharacter } from './data/characters';

type Props = {
  character: LandingCharacter;
  isActive: boolean;
  onSelect: () => void;
};

export function CharacterCard({ character, isActive, onSelect }: Props) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  useGaze(wrapRef, portraitRef, { maxX: 8, maxY: 6 });

  return (
    <button
      ref={wrapRef}
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`${character.name} — ${character.tagline}`}
      className={`group relative flex h-full w-[min(82vw,26rem)] shrink-0 flex-col items-stretch overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] text-left transition-[transform,filter,border-color,box-shadow] duration-500 ease-out will-change-[transform,filter] ${
        isActive
          ? 'scale-100 border-white/25'
          : 'scale-[0.97] motion-safe:group-hover/parade:[filter:blur(0)] motion-safe:[.parade:hover_&:not(:hover)]:blur-[2px] motion-safe:[.parade:hover_&:not(:hover)]:opacity-70'
      }`}
      style={{
        boxShadow: isActive
          ? `0 40px 120px -20px rgb(${character.accent.glow} / 0.45), 0 0 0 1px rgb(${character.accent.glow} / 0.25)`
          : `0 30px 80px -30px rgb(${character.accent.glow} / 0.25)`,
      }}
    >
      {/* Portrait with parallax layers */}
      <div
        ref={portraitRef}
        className="relative aspect-[3/4] w-full motion-safe:animate-[breathing_6s_ease-in-out_infinite]"
        style={{
          transform:
            'translate3d(var(--gaze-x, 0), var(--gaze-y, 0), 0) scale(var(--breath, 1))',
          willChange: 'transform',
        }}
      >
        <Image
          src={character.portrait}
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 768px) 26rem, 82vw"
          quality={85}
          className="object-cover object-[center_22%]"
        />

        {/* Atmosphere bottom fade — needed for legibility of the name/tagline overlay */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-nocturne via-nocturne/85 to-transparent"
        />
      </div>

      {/* Copy overlay */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-7 sm:p-9">
        <span
          className="text-xs uppercase tracking-[0.35em] text-whisper/50"
          style={{ color: `rgb(${character.accent.glow} / 0.85)` }}
        >
          {character.moods[0]}
        </span>
        <h3 className="font-display text-4xl font-light leading-none text-whisper sm:text-5xl">
          {character.name}
        </h3>
        <p className="text-base text-whisper/75">{character.tagline}</p>

        <span
          aria-hidden
          className="mt-4 inline-flex items-center gap-2 text-sm text-whisper/60 transition-colors duration-300 group-hover:text-whisper/90"
        >
          {isActive ? 'Open' : 'Meet her'}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>

      <style jsx>{`
        @keyframes breathing {
          0%,
          100% {
            --breath: 1;
          }
          50% {
            --breath: 1.012;
          }
        }
      `}</style>
    </button>
  );
}
