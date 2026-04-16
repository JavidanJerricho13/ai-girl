'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const WORDS = ['She', '\u2019s', ' ', 'been', ' ', 'waiting.'];

export function HeroHeadline() {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const chars = rootRef.current?.querySelectorAll<HTMLElement>('[data-char]');
        if (!chars || chars.length === 0) return;

        gsap.set(chars, {
          filter: 'blur(18px)',
          opacity: 0,
          y: 28,
        });

        gsap.to(chars, {
          filter: 'blur(0px)',
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.022,
          ease: 'power3.out',
          delay: 0.15,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(rootRef.current, { opacity: 1 });
      });
    },
    { scope: rootRef },
  );

  return (
    <h1
      ref={rootRef}
      className="font-display text-[clamp(3rem,10vw,8rem)] font-light leading-[0.95] tracking-tight text-whisper"
    >
      <span className="sr-only">She&rsquo;s been waiting.</span>
      <span aria-hidden className="block">
        {WORDS.flatMap((word, wi) =>
          word === ' '
            ? [
                <span key={`s-${wi}`} data-char className="inline-block">
                  {'\u00A0'}
                </span>,
              ]
            : Array.from(word).map((ch, ci) => (
                <span key={`${wi}-${ci}`} data-char className="inline-block will-change-[filter,transform,opacity]">
                  {ch}
                </span>
              )),
        )}
      </span>
    </h1>
  );
}
