import dynamic from 'next/dynamic';
import { Hero } from './_landing/Hero';

// Below-fold sections — lazy-loaded for faster initial paint.
// Hero stays eager since it's the LCP element.
const CharacterGallery = dynamic(() => import('./_landing/CharacterGallery').then(m => ({ default: m.CharacterGallery })), {
  loading: () => <div className="h-screen bg-nocturne" />,
});
const TryHer = dynamic(() => import('./_landing/TryHer').then(m => ({ default: m.TryHer })));
const Pricing = dynamic(() => import('./_landing/Pricing').then(m => ({ default: m.Pricing })));
const QuietReassurance = dynamic(() => import('./_landing/QuietReassurance').then(m => ({ default: m.QuietReassurance })));
const FAQ = dynamic(() => import('./_landing/FAQ').then(m => ({ default: m.FAQ })));
const FinalCTA = dynamic(() => import('./_landing/FinalCTA').then(m => ({ default: m.FinalCTA })));
const Footer = dynamic(() => import('./_landing/Footer').then(m => ({ default: m.Footer })));

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
