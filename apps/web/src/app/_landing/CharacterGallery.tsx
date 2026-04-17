'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LANDING_CHARACTERS, type LandingCharacter } from './data/characters';
import { CharacterCard } from './CharacterCard';
import { CharacterExpand } from './CharacterExpand';

export function CharacterGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<LandingCharacter | null>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Map vertical scroll progress (0→1) to horizontal translate
  // The section is pinned at 300vh height so we have scroll runway
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.35]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], [0, -12]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cast-heading"
      className="relative isolate w-full overflow-hidden bg-nocturne"
      style={{ height: prefersReduced ? 'auto' : '300vh' }}
    >
      {/* Ambient accent behind the parade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgb(var(--color-plum)/0.7),transparent_60%)]"
      />

      <div
        className="relative mx-auto flex flex-col items-center gap-10 px-6 md:gap-16"
        style={prefersReduced ? {} : { position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
      >
        <motion.header
          style={prefersReduced ? {} : { opacity: titleOpacity, y: titleY }}
          className="flex max-w-xl flex-col items-center gap-3 pt-8 text-center md:pt-24"
        >
          <span className="text-xs uppercase tracking-[0.5em] text-lilac/70">The Cast</span>
          <h2
            id="cast-heading"
            className="font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[1] text-whisper"
          >
            Your type is here.
          </h2>
        </motion.header>

        <div className="parade flex-1 w-full">
          <motion.div
            className="flex items-center gap-8 px-6 md:flex-nowrap md:gap-10 md:pl-[12vw] md:pr-[12vw]"
            style={prefersReduced ? {} : { x, willChange: 'transform' }}
          >
            {LANDING_CHARACTERS.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isActive={active?.id === character.id}
                onSelect={() => setActive(character)}
                greetingUrl={character.voiceSrc}
              />
            ))}
          </motion.div>
        </div>

        {/* Mobile scroll hint */}
        <p className="pb-8 text-xs uppercase tracking-[0.4em] text-whisper/40 md:hidden">
          swipe ←→
        </p>
      </div>

      <CharacterExpand character={active} onClose={() => setActive(null)} />

      <style jsx>{`
        .parade {
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .parade::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 768px) {
          .parade {
            overflow: visible;
          }
        }
      `}</style>
    </section>
  );
}
