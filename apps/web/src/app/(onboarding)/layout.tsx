import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find your match · Ethereal',
};

/**
 * Onboarding route group — deliberately bare. No AppShell, no auth gate;
 * these pages run before any account exists and feed into either the
 * landing guest flow or the /register page.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-nocturne text-whisper">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(var(--color-plum)/0.45),transparent_55%)]"
      />
      <div className="relative">{children}</div>
    </main>
  );
}
