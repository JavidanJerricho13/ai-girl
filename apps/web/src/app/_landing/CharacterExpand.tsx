'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { LandingCharacter } from './data/characters';

type Props = {
  character: LandingCharacter | null;
  onClose: () => void;
};

export function CharacterExpand({ character, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <AnimatePresence>
      {character ? (
        <motion.div
          key={character.id}
          role="dialog"
          aria-modal="true"
          aria-label={character.name}
          className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0 bg-nocturne/85 backdrop-blur-xl"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-plum/70 to-nocturne/95 shadow-[0_60px_140px_-20px_rgba(0,0,0,0.8)] md:grid-cols-[1.05fr_1fr]"
            style={{
              boxShadow: `0 60px 140px -20px rgb(${character.accent.glow} / 0.35)`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-whisper/70 backdrop-blur transition-colors hover:border-white/30 hover:text-whisper"
            >
              ×
            </button>

            <div className="relative aspect-[3/4] md:aspect-auto">
              <Image
                src={character.portrait}
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                quality={88}
                className="object-cover object-[center_25%]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-nocturne/95 via-nocturne/40 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-nocturne/70"
              />
            </div>

            <div className="relative flex flex-col justify-between gap-8 p-8 sm:p-12">
              <div className="flex flex-col gap-5">
                <span
                  className="text-xs uppercase tracking-[0.4em]"
                  style={{ color: `rgb(${character.accent.glow} / 0.9)` }}
                >
                  {character.tagline}
                </span>

                <h2 className="font-display text-5xl font-light leading-[0.95] text-whisper sm:text-6xl">
                  {character.name}
                </h2>

                <p className="max-w-prose text-lg leading-relaxed text-whisper/80">
                  {character.intro}
                </p>

                <motion.ul
                  className="flex flex-wrap gap-2 pt-2"
                  initial="hidden"
                  animate="shown"
                  variants={{
                    hidden: {},
                    shown: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
                  }}
                >
                  {character.moods.map((mood) => (
                    <motion.li
                      key={mood}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        shown: { opacity: 1, y: 0 },
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-whisper/80 backdrop-blur"
                    >
                      {mood}
                    </motion.li>
                  ))}
                </motion.ul>

                {character.voiceSrc ? (
                  <>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="mt-2 inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-whisper/90 backdrop-blur transition-colors hover:border-white/35 hover:bg-white/10"
                    >
                      <span
                        aria-hidden
                        className="grid h-6 w-6 place-items-center rounded-full"
                        style={{
                          background: `rgb(${character.accent.glow} / 0.3)`,
                        }}
                      >
                        {playing ? '❚❚' : '▶'}
                      </span>
                      {playing ? 'Listening' : 'Hear her'}
                    </button>
                    <audio
                      ref={audioRef}
                      src={character.voiceSrc}
                      preload="none"
                      onEnded={() => setPlaying(false)}
                    />
                  </>
                ) : null}
              </div>

              <Link
                href={`/register?char=${character.id}`}
                className="group inline-flex w-fit items-center gap-3 rounded-full px-7 py-4 text-base font-medium text-whisper transition-all duration-300 hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, rgb(${character.accent.glow} / 0.85), rgb(${character.accent.edge} / 0.85))`,
                  boxShadow: `0 20px 50px -10px rgb(${character.accent.glow} / 0.55)`,
                }}
              >
                Talk to {character.name}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
