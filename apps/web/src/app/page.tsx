import { Hero } from './_landing/Hero';
import { AuthRedirect } from './_landing/AuthRedirect';
import { CharacterGallery } from './_landing/CharacterGallery';
import { TryHer } from './_landing/TryHer';
import { Pricing } from './_landing/Pricing';
import { QuietReassurance } from './_landing/QuietReassurance';
import { FAQ } from './_landing/FAQ';
import { FinalCTA } from './_landing/FinalCTA';
import { Footer } from './_landing/Footer';

export default function HomePage() {
  return (
    <main className="bg-nocturne text-whisper">
      <AuthRedirect />
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
