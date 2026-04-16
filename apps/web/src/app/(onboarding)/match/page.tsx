'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';

/**
 * 4-question onboarding quiz that derives the user's ideal (warmth,
 * playfulness) point, then asks the backend for the 3 closest characters.
 *
 * Each question contributes to ONE axis so the scoring is legible:
 *   Q1, Q2 → warmth
 *   Q3, Q4 → playfulness
 * Final axis value = average of its two questions. This keeps the math
 * transparent: if you answer "pull me close" (80) and "be openly warm"
 * (75), your warmth score is ~78.
 */

type Axis = 'warmth' | 'playfulness';

interface Question {
  prompt: string;
  axis: Axis;
  options: { label: string; value: number }[];
}

const QUESTIONS: Question[] = [
  {
    prompt: 'When we first meet, I want her to…',
    axis: 'warmth',
    options: [
      { label: 'Keep her distance — I like a slow burn', value: 25 },
      { label: 'Be openly warm from the start', value: 80 },
    ],
  },
  {
    prompt: "If I'm having a hard day, she should…",
    axis: 'warmth',
    options: [
      { label: 'Give me space to figure it out', value: 30 },
      { label: 'Pull me close', value: 85 },
    ],
  },
  {
    prompt: 'Her sense of humour should be…',
    axis: 'playfulness',
    options: [
      { label: 'Thoughtful, dry, measured', value: 25 },
      { label: 'Playful, teasing, quick-witted', value: 85 },
    ],
  },
  {
    prompt: "She'd rather talk about…",
    axis: 'playfulness',
    options: [
      { label: 'The weight of things', value: 30 },
      { label: 'Whatever makes us laugh', value: 80 },
    ],
  },
];

interface CharacterMatch {
  id: string;
  name: string;
  displayName: string;
  description: string;
  warmth: number;
  playfulness: number;
  isPremium: boolean;
  avatarUrl: string | null;
  matchScore: number;
}

type Stage =
  | { phase: 'quiz'; step: number; answers: (number | null)[] }
  | { phase: 'loading' }
  | { phase: 'results'; matches: CharacterMatch[]; scores: { warmth: number; playfulness: number } }
  | { phase: 'error'; message: string };

export default function MatchPage() {
  const [stage, setStage] = useState<Stage>({
    phase: 'quiz',
    step: 0,
    answers: QUESTIONS.map(() => null),
  });

  const handleAnswer = async (value: number) => {
    if (stage.phase !== 'quiz') return;

    const nextAnswers = [...stage.answers];
    nextAnswers[stage.step] = value;

    if (stage.step < QUESTIONS.length - 1) {
      setStage({ phase: 'quiz', step: stage.step + 1, answers: nextAnswers });
      return;
    }

    // Last answer — compute axes and fetch matches.
    setStage({ phase: 'loading' });
    try {
      const warmthAnswers = QUESTIONS.map((q, i) => (q.axis === 'warmth' ? nextAnswers[i] : null)).filter(
        (v): v is number => v !== null,
      );
      const playfulnessAnswers = QUESTIONS.map((q, i) =>
        q.axis === 'playfulness' ? nextAnswers[i] : null,
      ).filter((v): v is number => v !== null);

      const warmth = Math.round(warmthAnswers.reduce((a, b) => a + b, 0) / warmthAnswers.length);
      const playfulness = Math.round(
        playfulnessAnswers.reduce((a, b) => a + b, 0) / playfulnessAnswers.length,
      );

      const res = await apiClient.post<CharacterMatch[]>('/api/characters/match', {
        warmth,
        playfulness,
      });
      setStage({
        phase: 'results',
        matches: res.data,
        scores: { warmth, playfulness },
      });
    } catch (err: any) {
      setStage({
        phase: 'error',
        message: err?.response?.data?.message || 'Could not load your matches. Try again?',
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-stretch justify-center px-6 py-16">
      <AnimatePresence mode="wait">
        {stage.phase === 'quiz' ? (
          <QuizStep
            key={`quiz-${stage.step}`}
            question={QUESTIONS[stage.step]}
            stepIndex={stage.step}
            total={QUESTIONS.length}
            onAnswer={handleAnswer}
          />
        ) : null}

        {stage.phase === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 size={28} className="animate-spin text-lilac" />
            <p className="text-sm text-whisper/60">Finding who you'd click with…</p>
          </motion.div>
        ) : null}

        {stage.phase === 'results' ? (
          <ResultsStep key="results" matches={stage.matches} />
        ) : null}

        {stage.phase === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <p className="text-sm text-whisper/80">{stage.message}</p>
            <button
              onClick={() =>
                setStage({ phase: 'quiz', step: 0, answers: QUESTIONS.map(() => null) })
              }
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-whisper hover:border-lilac/60"
            >
              Start over
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function QuizStep({
  question,
  stepIndex,
  total,
  onAnswer,
}: {
  question: Question;
  stepIndex: number;
  total: number;
  onAnswer: (value: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-whisper/50">
        <Sparkles size={12} className="text-lilac" />
        Step {stepIndex + 1} of {total}
      </div>
      <h1 className="font-display text-4xl font-light leading-tight text-whisper sm:text-5xl">
        {question.prompt}
      </h1>
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onAnswer(opt.value)}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-left text-base text-whisper backdrop-blur-md transition-all hover:border-lilac/60 hover:bg-white/[0.06]"
          >
            <span>{opt.label}</span>
            <span className="text-whisper/30 transition-transform group-hover:translate-x-1 group-hover:text-lilac/90">
              →
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ResultsStep({ matches }: { matches: CharacterMatch[] }) {
  if (!matches.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <p className="text-sm text-whisper/80">
          No characters available yet. Check back soon.
        </p>
      </motion.div>
    );
  }

  const primary = matches[0];
  const rest = matches.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-whisper/50">
        <Sparkles size={12} className="text-lilac" />
        Your matches
      </div>

      {/* Primary match — big card, direct CTA into guest chat. */}
      <Link
        href={`/match/chat/${primary.id}`}
        className="group relative overflow-hidden rounded-3xl border border-lilac/40 bg-gradient-to-br from-plum/50 to-nocturne/60 p-6 backdrop-blur-md transition-all hover:border-lilac/70"
      >
        <div className="flex items-start gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/10">
            {primary.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primary.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl text-whisper/60">
                {primary.displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-lilac">
              <span className="rounded-full bg-lilac/20 px-2 py-0.5 font-medium">
                {primary.matchScore}% match
              </span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-light text-whisper">
              {primary.displayName}
            </h2>
            <p className="mt-2 text-sm text-whisper/70 line-clamp-2">{primary.description}</p>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm text-whisper/90 group-hover:bg-white/[0.15]">
          Start talking
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </Link>

      {rest.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-whisper/40">Also a good fit</p>
          {rest.map((c) => (
            <Link
              key={c.id}
              href={`/match/chat/${c.id}`}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md transition-colors hover:border-white/30"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {c.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-whisper/60">
                    {c.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-whisper">{c.displayName}</p>
                <p className="text-xs text-whisper/50 line-clamp-1">{c.description}</p>
              </div>
              <span className="text-xs text-whisper/40">{c.matchScore}%</span>
            </Link>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
