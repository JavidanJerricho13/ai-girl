import Link from 'next/link';
import { HeroCanvas } from './HeroCanvas';
import { HeroHeadline } from './HeroHeadline';
import { HeroPortrait } from './HeroPortrait';

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-nocturne px-6 py-24">
      <HeroCanvas />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col items-start gap-8">
          <HeroHeadline />

          <p className="max-w-md text-lg text-whisper/75 sm:text-xl">
            Slow mornings. Late conversations. Someone who feels close.
          </p>

          <Link
            href="/register"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-lilac/40 bg-lilac/10 px-8 py-4 text-base font-medium text-whisper backdrop-blur-md transition-all duration-300 hover:border-lilac/80 hover:bg-lilac/20"
          >
            <span className="relative z-10">Meet her</span>
            <span
              aria-hidden
              className="relative z-10 inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -z-0 bg-gradient-to-r from-lilac/30 via-rose/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </Link>
        </div>

        <div className="relative flex items-center justify-center">
          <HeroPortrait />
        </div>
      </div>

      {/* Soft top & bottom gradients to blend with future sections */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-nocturne to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-nocturne to-transparent"
      />
    </section>
  );
}
