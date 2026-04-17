'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Check, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api-client';

type Step = 'input' | 'persona' | 'visual' | 'gallery' | 'done';

interface Persona {
  name: string;
  displayName: string;
  description: string;
  backstory: string;
  speechQuirks: string[];
  signaturePhrases: string[];
  bannedPhrases: string[];
  warmth: number;
  playfulness: number;
  visualDescriptor: string;
}

interface Candidate {
  url: string;
  seed: number;
  width: number;
  height: number;
}

export default function CharacterStudioPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [archetype, setArchetype] = useState('');
  const [keywords, setKeywords] = useState('');

  // Step 2
  const [persona, setPersona] = useState<Persona | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);

  // Step 3
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Step 4
  const [galleryCount, setGalleryCount] = useState<number | null>(null);

  const handleGeneratePersona = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/admin/studio/generate-persona', {
        archetype,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
      setPersona(res.data);
      setStep('persona');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPersona = async () => {
    if (!persona) return;
    setLoading(true);
    setError(null);
    try {
      // Create character row
      const createRes = await apiClient.post('/admin/studio/create-character', persona);
      setCharacterId(createRes.data.characterId);

      // Generate candidate images
      const imgRes = await apiClient.post('/admin/studio/generate-candidates', {
        visualDescriptor: persona.visualDescriptor,
        count: 4,
      });
      setCandidates(imgRes.data);
      setStep('visual');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create character or generate images');
    } finally {
      setLoading(false);
    }
  };

  const handleLockVisual = async () => {
    if (selectedIdx === null || !characterId || !candidates[selectedIdx]) return;
    const picked = candidates[selectedIdx];
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/admin/studio/lock-visual-dna', {
        characterId,
        seed: picked.seed,
        basePrompt: `portrait photo, ${persona?.visualDescriptor}, soft cinematic lighting, shallow depth of field`,
        imageUrl: picked.url,
      });

      // Auto-generate gallery
      const galleryRes = await apiClient.post('/admin/studio/generate-gallery', {
        characterId,
      });
      setGalleryCount(galleryRes.data.count);
      setStep('gallery');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to lock visual or generate gallery');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Record<Step, string> = {
    input: '1. Inputs',
    persona: '2. Review Persona',
    visual: '3. Pick Visual DNA',
    gallery: '4. Gallery Generated',
    done: '5. Done',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {Object.entries(stepLabels).map(([key, label]) => {
          const steps: Step[] = ['input', 'persona', 'visual', 'gallery', 'done'];
          const current = steps.indexOf(step);
          const idx = steps.indexOf(key as Step);
          const done = idx < current;
          const active = idx === current;
          return (
            <div
              key={key}
              className={`flex-1 text-center text-xs py-2 rounded-lg border transition-colors ${
                done
                  ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                  : active
                    ? 'bg-indigo-900/30 border-indigo-600/50 text-indigo-300'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'
              }`}
            >
              {done ? <Check size={12} className="inline mr-1" /> : null}
              {label}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Inputs */}
      {step === 'input' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-zinc-200">Character Studio</h2>
          <p className="text-sm text-zinc-500">
            Enter an archetype and keywords. The AI will generate a complete character persona,
            visual DNA, and gallery.
          </p>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Archetype *
            </label>
            <input
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder="e.g. mysterious bookworm, sporty extrovert"
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Keywords (comma-separated)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="warm, teasing, night owl, loves jazz"
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <button
            onClick={handleGeneratePersona}
            disabled={!archetype.trim() || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate Persona
          </button>
        </div>
      )}

      {/* Step 2: Review Persona */}
      {step === 'persona' && persona && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-200">{persona.displayName}</h2>
          <p className="text-sm text-zinc-400">{persona.description}</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-500">Warmth:</span>{' '}
              <span className="text-zinc-300">{persona.warmth}</span>
            </div>
            <div>
              <span className="text-zinc-500">Playfulness:</span>{' '}
              <span className="text-zinc-300">{persona.playfulness}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Backstory</p>
            <pre className="text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">
              {persona.backstory}
            </pre>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Visual</p>
            <p className="text-xs text-zinc-300">{persona.visualDescriptor}</p>
          </div>
          <button
            onClick={handleAcceptPersona}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Create & Generate Images
          </button>
        </div>
      )}

      {/* Step 3: Pick Visual DNA */}
      {step === 'visual' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-200">Pick her look</h2>
          <p className="text-sm text-zinc-500">
            Select the image that best represents {persona?.displayName}. The seed + prompt will
            be locked for all future gallery images.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all ${
                  selectedIdx === i
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.url}
                  alt={`Candidate ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedIdx === i && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleLockVisual}
            disabled={selectedIdx === null || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Lock Visual DNA & Generate Gallery
          </button>
        </div>
      )}

      {/* Step 4: Gallery Done */}
      {step === 'gallery' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-center">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-200">
            {persona?.displayName} is ready
          </h2>
          <p className="text-sm text-zinc-400">
            {galleryCount} gallery images generated. Visual DNA locked.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push(`/characters/${characterId}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Character
            </button>
            <button
              onClick={() => {
                setStep('input');
                setPersona(null);
                setCharacterId(null);
                setCandidates([]);
                setSelectedIdx(null);
                setGalleryCount(null);
                setArchetype('');
                setKeywords('');
              }}
              className="px-5 py-2.5 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
