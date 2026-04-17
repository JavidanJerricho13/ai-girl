'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  Users,
  Coins,
  BarChart3,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  displayName: string;
  description: string;
  backstory: string;
  speechQuirks: string[];
  bannedPhrases: string[];
  signaturePhrases: string[];
  isPublic: boolean;
  isPremium: boolean;
  isOfficial: boolean;
  category: string[];
  tags: string[];
  conversationCount: number;
  messageCount: number;
  avgRating: number | null;
  warmth: number;
  playfulness: number;
  createdAt: string;
  media: Array<{ url: string; type: string }>;
  creator: { id: string; username: string | null; email: string };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Helpers ──────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Generate mock 30-day chart data from character stats
function generateChartData(messageCount: number) {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const base = Math.max(1, Math.floor(messageCount / 60));
    const variation = Math.floor(Math.random() * base * 0.6);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages: base + variation,
    });
  }
  return data;
}

// ── Stat Card ────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="text-zinc-600">{icon}</div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ── Personality Bar ──────────────────────────────────────

function PersonalityBar({
  left,
  right,
  value,
}: {
  left: string;
  right: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-right text-zinc-500">{left}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full relative">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-16 text-zinc-500">{right}</span>
    </div>
  );
}

// ── Custom Tooltip ───────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value} messages
      </p>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────

function DetailSkeleton() {
  return (
    <div>
      <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse mb-6" />
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-xl bg-zinc-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800/60 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse" />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function CharacterDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const {
    data: character,
    isLoading,
    isError,
    refetch,
  } = useQuery<Character>({
    queryKey: ['admin-character', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/characters/${id}`);
      return res.data;
    },
  });

  const handleToggleVisibility = async () => {
    if (!character) return;
    try {
      await apiClient.patch(`/admin/characters/${id}/visibility`, {
        isPublic: !character.isPublic,
      });
      toast.success(`Character ${!character.isPublic ? 'published' : 'unpublished'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-character', id] });
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !character) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-zinc-400 mb-3">
          Character not found
        </p>
        <Link
          href="/characters"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Back to list
        </Link>
      </div>
    );
  }

  const avatarUrl = character.media?.find((m) => m.type === 'profile')?.url;
  const name = character.displayName || character.name;
  const chartData = generateChartData(character.messageCount);
  const avgPerUser =
    character.conversationCount > 0
      ? Math.round(character.messageCount / character.conversationCount)
      : 0;

  return (
    <div>
      {/* Back */}
      <Link
        href="/characters"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Characters
      </Link>

      {/* Hero header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{name}</h1>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                  character.isPublic
                    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/30'
                }`}
              >
                {character.isPublic ? 'Public' : 'Draft'}
              </span>
              {character.isPremium && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 border border-yellow-700/30">
                  PRO
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              Created by{' '}
              {character.creator?.username || character.creator?.email}{' '}
              · {formatDate(character.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/characters/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
          >
            <Pencil size={14} />
            Edit
          </Link>
          <a
            href={`http://localhost:3000/characters/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Messages"
          value={formatCount(character.messageCount)}
          icon={<MessageSquare size={16} />}
        />
        <StatCard
          title="Unique Users"
          value={formatCount(character.conversationCount)}
          icon={<Users size={16} />}
        />
        <StatCard
          title="Avg Messages/User"
          value={String(avgPerUser)}
          icon={<BarChart3 size={16} />}
        />
        <StatCard
          title="Rating"
          value={
            character.avgRating != null
              ? character.avgRating.toFixed(1)
              : '—'
          }
          icon={<Star size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Messages (30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#msgGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Personality snapshot */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Personality
          </h3>
          <div className="space-y-4">
            <PersonalityBar
              left="Cool"
              right="Warm"
              value={character.warmth}
            />
            <PersonalityBar
              left="Grave"
              right="Playful"
              value={character.playfulness}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {character.category.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 capitalize"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Persona + Moderation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Persona template */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Persona Template
          </h3>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Backstory</p>
            <pre className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/50 rounded-lg p-4 border border-zinc-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {character.backstory || '—'}
            </pre>
          </div>
          {character.speechQuirks?.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Speech Quirks</p>
              <div className="flex flex-wrap gap-1.5">
                {character.speechQuirks.map((q: string) => (
                  <span key={q} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-md">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}
          {character.signaturePhrases?.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Signature Phrases</p>
              <div className="flex flex-wrap gap-1.5">
                {character.signaturePhrases.map((p: string) => (
                  <span key={p} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-md">
                    "{p}"
                  </span>
                ))}
              </div>
            </div>
          )}
          {character.bannedPhrases?.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Banned Phrases</p>
              <div className="flex flex-wrap gap-1.5">
                {character.bannedPhrases.map((b: string) => (
                  <span key={b} className="px-2 py-0.5 bg-red-900/40 text-red-300 text-xs rounded-md">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Moderation actions */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Moderation
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleToggleVisibility}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                character.isPublic
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {character.isPublic ? (
                <>
                  <EyeOff size={14} />
                  Unpublish
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Approve & Publish
                </>
              )}
            </button>

            <Link
              href={`/characters/${id}/edit`}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Pencil size={14} />
              Edit Character
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
              Info
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ID</span>
                <span className="font-mono text-zinc-500">
                  {character.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Created</span>
                <span>{formatDate(character.createdAt)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tags</span>
                <span>{character.tags.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
