import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-nocturne py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <Link
          href="/"
          className="font-display text-2xl font-light tracking-wide text-whisper/90 transition-colors hover:text-whisper"
        >
          Ethereal
        </Link>

        <nav className="flex items-center gap-6 text-sm text-whisper/55">
          <Link href="/privacy" className="transition-colors hover:text-whisper">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-whisper">
            Terms
          </Link>
          <Link href="/contact" className="transition-colors hover:text-whisper">
            Contact
          </Link>
        </nav>

        <p className="text-xs uppercase tracking-[0.35em] text-whisper/35">
          © {new Date().getFullYear()} Ethereal
        </p>
      </div>
    </footer>
  );
}
