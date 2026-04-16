'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { LANDING_CHARACTERS, type LandingCharacter } from './data/characters';
import { CharacterCard } from './CharacterCard';
import { CharacterExpand } from './CharacterExpand';
import { registerScrollTrigger } from '@/lib/gsap';

export function CharacterGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [active, setActive] = useState<LandingCharacter | null>(null);
  const [stReady, setStReady] = useState(false);

  useEffect(() => {
    void registerScrollTrigger().then(() => setStReady(true));
  }, []);

  useGSAP(
    () => {
      if (!stReady || !sectionRef.current || !trackRef.current) return;

      const mm = gsap.matchMedia();

      // Desktop: horizontal scroll-jack
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current!;
        const section = sectionRef.current!;
        const distance = () => track.scrollWidth - window.innerWidth + 96;

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });

        // Title fades as parade begins
        if (titleRef.current) {
          gsap.to(titleRef.current, {
            opacity: 0.35,
            y: -12,
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: 'top -20%',
              scrub: 0.5,
            },
          });
        }

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });
    },
    { dependencies: [stReady], scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cast-heading"
      className="relative isolate w-full overflow-hidden bg-nocturne py-28 md:h-screen md:py-0"
    >
      {/* Ambient accent behind the parade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgb(var(--color-plum)/0.7),transparent_60%)]"
      />

      <div className="relative mx-auto flex h-full flex-col items-center gap-10 px-6 md:gap-16">
        <header
          ref={titleRef}
          className="flex max-w-xl flex-col items-center gap-3 pt-8 text-center md:pt-24"
        >
          <span className="text-xs uppercase tracking-[0.5em] text-lilac/70">The Cast</span>
          <h2
            id="cast-heading"
            className="font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[1] text-whisper"
          >
            Your type is here.
          </h2>
        </header>

        <div className="parade flex-1 w-full">
          <div
            ref={trackRef}
            className="flex items-center gap-8 px-6 md:flex-nowrap md:gap-10 md:pl-[12vw] md:pr-[12vw]"
            style={{ willChange: 'transform' }}
          >
            {LANDING_CHARACTERS.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isActive={active?.id === character.id}
                onSelect={() => setActive(character)}
              />
            ))}
          </div>
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
