import { Hero } from './_landing/Hero';
import { CharacterGallery } from './_landing/CharacterGallery';
import { TryHer } from './_landing/TryHer';
import { Pricing } from './_landing/Pricing';
import { QuietReassurance } from './_landing/QuietReassurance';
import { FAQ } from './_landing/FAQ';
import { FinalCTA } from './_landing/FinalCTA';
import { Footer } from './_landing/Footer';

// Authenticated visitors are redirected to /discover by the edge middleware
// (apps/web/src/middleware.ts) — no client-side auth check needed here.
export default function HomePage() {
  return (
    <main className="bg-nocturne text-whisper">
      <Hero />
      <CharacterGallery />
      <TryHer />
      <Pricing />
      <QuietReassurance />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
