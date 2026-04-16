'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { LANDING_CHARACTERS } from './data/characters';
import { TRY_HER_OPENER, TRY_HER_GATE_PROMPT, pickReply } from './data/tryHerScript';

type Bubble =
  | { id: string; from: 'her'; text: string; reveal: 'typing' | 'done' }
  | { id: string; from: 'you'; text: string };

const character = LANDING_CHARACTERS.find((c) => c.id === 'aria') ?? LANDING_CHARACTERS[0];

const MAX_CHARS = 120;

export function TryHer() {
  const sectionRef = useRef<HTMLElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gateRef = useRef<HTMLAnchorElement>(null);

  const [activated, setActivated] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);
  const [sheReplied, setSheReplied] = useState(false);

  // Wake up when visible — opener starts typing only once
  useEffect(() => {
    if (activated || !sectionRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivated(true);
          io.disconnect();
        }
      },
      { rootMargin: '-20% 0px' },
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, [activated]);

  // Push opener once activated
  useEffect(() => {
    if (!activated) return;
    setBubbles([{ id: 'opener', from: 'her', text: TRY_HER_OPENER, reveal: 'typing' }]);
  }, [activated]);

  // Auto-scroll stream to bottom on new bubble
  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [bubbles]);

  // Focus input after opener finishes typing
  const onOpenerDone = () => {
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim().slice(0, MAX_CHARS);
    if (!text || sent) return;

    setSent(true);
    setBubbles((prev) => [
      ...prev,
      { id: 'you-1', from: 'you', text },
    ]);

    // Her reply — small delay so it feels like she's thinking
    const reply = pickReply(text);
    window.setTimeout(() => {
      setBubbles((prev) => [
        ...prev,
        { id: 'her-2', from: 'her', text: reply, reveal: 'typing' },
      ]);
    }, 650);
  };

  // After her second reply, focus the gate CTA
  useEffect(() => {
    if (sheReplied) {
      gateRef.current?.focus({ preventScroll: true });
    }
  }, [sheReplied]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="tryher-heading"
      className="relative isolate w-full overflow-hidden bg-nocturne py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgb(var(--color-plum)/0.55),transparent_55%)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-[0.8fr_1fr] md:gap-20">
        {/* Presence side */}
        <div className="flex flex-col items-center gap-6 md:items-start">
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 motion-safe:animate-[breathing_5.5s_ease-in-out_infinite]">
            <Image
              src={character.portrait}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 768px) 24rem, 80vw"
              quality={88}
              className="object-cover object-[center_22%]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-nocturne via-nocturne/40 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <span
                className="text-xs uppercase tracking-[0.4em]"
                style={{ color: `rgb(${character.accent.glow} / 0.9)` }}
              >
                A quiet moment
              </span>
              <h2
                id="tryher-heading"
                className="mt-2 font-display text-5xl font-light leading-none text-whisper"
              >
                She said hi.
              </h2>
            </div>
          </div>
        </div>

        {/* Conversation side */}
        <div className="flex flex-col gap-5">
          <div
            ref={streamRef}
            aria-live="polite"
            className="flex max-h-[28rem] min-h-[18rem] flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md"
          >
            <AnimatePresence initial={false}>
              {bubbles.map((bubble) =>
                bubble.from === 'her' ? (
                  <HerBubble
                    key={bubble.id}
                    text={bubble.text}
                    glow={character.accent.glow}
                    onDone={() => {
                      if (bubble.id === 'opener') onOpenerDone();
                      if (bubble.id === 'her-2') setSheReplied(true);
                    }}
                  />
                ) : (
                  <YouBubble key={bubble.id} text={bubble.text} />
                ),
              )}
            </AnimatePresence>
          </div>

          {!sent ? (
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <label htmlFor="tryher-input" className="sr-only">
                Say something back
              </label>
              <input
                ref={inputRef}
                id="tryher-input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_CHARS}
                placeholder="Say something back…"
                disabled={!activated}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-base text-whisper placeholder:text-whisper/40 outline-none backdrop-blur-md transition-colors focus:border-lilac/60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || !activated}
                className="grid h-12 w-12 place-items-center rounded-full text-whisper transition-all disabled:opacity-40"
                aria-label="Send"
                style={{
                  background: `linear-gradient(135deg, rgb(${character.accent.glow} / 0.9), rgb(${character.accent.edge} / 0.9))`,
                  boxShadow: `0 12px 30px -8px rgb(${character.accent.glow} / 0.55)`,
                }}
              >
                →
              </button>
            </form>
          ) : null}

          <AnimatePresence>
            {sheReplied ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-plum/40 to-nocturne/60 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-lg text-whisper/85">{TRY_HER_GATE_PROMPT}</p>
                <Link
                  ref={gateRef}
                  href={`/register?char=${character.id}`}
                  className="group inline-flex items-center gap-3 rounded-full px-6 py-3 text-base font-medium text-whisper transition-all duration-300 hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, rgb(${character.accent.glow} / 0.9), rgb(${character.accent.edge} / 0.9))`,
                    boxShadow: `0 20px 50px -10px rgb(${character.accent.glow} / 0.55)`,
                  }}
                >
                  Keep talking
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathing {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.008);
          }
        }
      `}</style>
    </section>
  );
}

function HerBubble({
  text,
  glow,
  onDone,
}: {
  text: string;
  glow: string;
  onDone?: () => void;
}) {
  const full = text;
  const [shown, setShown] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setShown(full);
      onDone?.();
      return;
    }

    let i = 0;
    let raf = 0;
    let last = performance.now();
    const perChar = 24; // ms

    const tick = (now: number) => {
      if (i < full.length && now - last >= perChar) {
        i += 1;
        setShown(full.slice(0, i));
        last = now;
      }
      if (i < full.length) {
        raf = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, reducedMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex"
    >
      <div
        className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-5 py-3 text-base text-whisper backdrop-blur"
        style={{ boxShadow: `inset 0 0 0 1px rgb(${glow} / 0.15)` }}
      >
        {shown}
        {shown.length < full.length ? (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] align-middle"
            style={{ background: `rgb(${glow} / 0.85)`, animation: 'blink 1s step-end infinite' }}
          />
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </motion.div>
  );
}

function YouBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-whisper/90 px-5 py-3 text-base text-nocturne">
        {text}
      </div>
    </motion.div>
  );
}
