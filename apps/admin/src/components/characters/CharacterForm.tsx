'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────

interface CharacterFormData {
  name: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  warmth: number;
  playfulness: number;
  voiceId: string;
  voiceProvider: string;
  isPublic: boolean;
  isPremium: boolean;
  category: string[];
  tags: string[];
}

interface CharacterFormProps {
  mode: 'create' | 'edit';
  characterId?: string;
  initialData?: any;
}

const EMPTY_FORM: CharacterFormData = {
  name: '',
  displayName: '',
  description: '',
  systemPrompt: '',
  warmth: 50,
  playfulness: 50,
  voiceId: '',
  voiceProvider: '',
  isPublic: false,
  isPremium: false,
  category: [],
  tags: [],
};

const CATEGORIES = [
  'romance',
  'friendship',
  'mentor',
  'adventure',
  'fantasy',
  'roleplay',
  'educational',
  'comedy',
  'horror',
];

const VOICE_PROVIDERS = ['elevenlabs', 'azure', 'google'];

// ── Section Nav ──────────────────────────────────────────

const SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'personality', label: 'Personality' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'voice', label: 'Voice' },
  { id: 'discovery', label: 'Discovery' },
];

function SectionNav({ active }: { active: string }) {
  return (
    <nav className="space-y-1">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            active === s.id
              ? 'bg-indigo-900/30 text-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

// ── Slider ───────────────────────────────────────────────

function PersonalitySlider({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-xs text-zinc-500">{left}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
      <span className="w-20 text-xs text-zinc-500">{right}</span>
      <span className="w-8 text-right text-xs text-zinc-400 font-mono">
        {value}
      </span>
    </div>
  );
}

// ── Tag Input ────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim()) && tags.length < 10) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl min-h-[42px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-md"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-zinc-500 hover:text-zinc-300"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'Add tags (Enter to add)' : ''}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
      />
    </div>
  );
}

// ── Main Form ────────────────────────────────────────────

export function CharacterForm({
  mode,
  characterId,
  initialData,
}: CharacterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CharacterFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('identity');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? '',
        displayName: initialData.displayName ?? '',
        description: initialData.description ?? '',
        systemPrompt: initialData.systemPrompt ?? '',
        warmth: initialData.warmth ?? 50,
        playfulness: initialData.playfulness ?? 50,
        voiceId: initialData.voiceId ?? '',
        voiceProvider: initialData.voiceProvider ?? '',
        isPublic: initialData.isPublic ?? false,
        isPremium: initialData.isPremium ?? false,
        category: initialData.category ?? [],
        tags: initialData.tags ?? [],
      });
    }
  }, [initialData]);

  const updateField = <K extends keyof CharacterFormData>(
    key: K,
    value: CharacterFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.name.length > 50) errs.name = 'Name must be under 50 chars';
    if (!form.displayName.trim()) errs.displayName = 'Display name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (form.description.length < 10) errs.description = 'At least 10 characters';
    if (!form.systemPrompt.trim()) errs.systemPrompt = 'System prompt is required';
    if (form.systemPrompt.length < 50) errs.systemPrompt = 'At least 50 characters';
    if (form.category.length === 0) errs.category = 'Select at least one category';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (publish: boolean) => {
    if (!validate()) return;
    setIsSaving(true);

    const payload = {
      ...form,
      isPublic: publish ? true : form.isPublic,
      voiceId: form.voiceId || undefined,
      voiceProvider: form.voiceProvider || undefined,
    };

    try {
      if (mode === 'create') {
        await apiClient.post('/admin/characters', payload);
      } else if (characterId) {
        await apiClient.patch(`/admin/characters/${characterId}`, payload);
      }
      router.push('/characters');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save character';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!characterId) return;
    if (!confirm('Delete this character permanently?')) return;
    try {
      await apiClient.delete(`/admin/characters/${characterId}`);
      router.push('/characters');
    } catch {
      alert('Failed to delete character');
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left: Section nav (sticky) */}
      <div className="w-36 shrink-0 hidden lg:block">
        <div className="sticky top-20">
          <SectionNav active={activeSection} />
        </div>
      </div>

      {/* Center: Form */}
      <div className="flex-1 min-w-0 space-y-6 max-w-3xl">
        {/* Identity */}
        <section
          id="identity"
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Identity & Visuals
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. luna_ai"
                className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name
                    ? 'border-red-600 focus:border-red-600 focus:ring-red-600/30'
                    : 'border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600/30'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Display Name *
              </label>
              <input
                value={form.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="e.g. Luna"
                className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.displayName
                    ? 'border-red-600 focus:border-red-600 focus:ring-red-600/30'
                    : 'border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600/30'
                }`}
              />
              {errors.displayName && (
                <p className="text-[11px] text-red-400 mt-1">
                  {errors.displayName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="A brief character description..."
              rows={3}
              className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-xl text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 transition-colors ${
                errors.description
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-600/30'
                  : 'border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600/30'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-red-400 mt-1">
                {errors.description}
              </p>
            )}
            <p className="text-[10px] text-zinc-600 mt-1 text-right">
              {form.description.length} / 500
            </p>
          </div>
        </section>

        {/* Personality */}
        <section
          id="personality"
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Personality Sliders
          </h3>
          <div className="space-y-5">
            <PersonalitySlider
              left="Cool"
              right="Warm"
              value={form.warmth}
              onChange={(v) => updateField('warmth', v)}
            />
            <PersonalitySlider
              left="Grave"
              right="Playful"
              value={form.playfulness}
              onChange={(v) => updateField('playfulness', v)}
            />
          </div>
        </section>

        {/* Intelligence */}
        <section
          id="intelligence"
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Core Intelligence
          </h3>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              System Prompt *
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => updateField('systemPrompt', e.target.value)}
              placeholder="Define the character's personality, behavior, and knowledge..."
              rows={10}
              className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-xl text-sm text-zinc-200 placeholder-zinc-600 resize-y font-mono focus:outline-none focus:ring-1 transition-colors ${
                errors.systemPrompt
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-600/30'
                  : 'border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600/30'
              }`}
            />
            {errors.systemPrompt && (
              <p className="text-[11px] text-red-400 mt-1">
                {errors.systemPrompt}
              </p>
            )}
            <p className="text-[10px] text-zinc-600 mt-1 text-right">
              {form.systemPrompt.length} / 10,000
            </p>
          </div>
        </section>

        {/* Voice */}
        <section
          id="voice"
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Voice Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Voice Provider
              </label>
              <select
                value={form.voiceProvider}
                onChange={(e) => updateField('voiceProvider', e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 appearance-none cursor-pointer transition-colors"
              >
                <option value="">None</option>
                {VOICE_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Voice ID
              </label>
              <input
                value={form.voiceId}
                onChange={(e) => updateField('voiceId', e.target.value)}
                placeholder="e.g. voice_abc123"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Discovery */}
        <section
          id="discovery"
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Discovery & Access
          </h3>

          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Categories *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = form.category.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        updateField(
                          'category',
                          form.category.filter((c) => c !== cat),
                        );
                      } else if (form.category.length < 3) {
                        updateField('category', [...form.category, cat]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${
                      selected
                        ? 'bg-indigo-900/30 border-indigo-600 text-indigo-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-[11px] text-red-400 mt-1">
                {errors.category}
              </p>
            )}
            <p className="text-[10px] text-zinc-600 mt-1">
              Select 1-3 categories
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Tags
            </label>
            <TagInput
              tags={form.tags}
              onChange={(tags) => updateField('tags', tags)}
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Max 10 tags. Press Enter to add.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => updateField('isPublic', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-600 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => updateField('isPremium', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-600 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">Premium</span>
            </label>
          </div>
        </section>
      </div>

      {/* Right: Sticky actions */}
      <div className="w-56 shrink-0 hidden xl:block">
        <div className="sticky top-20 space-y-4">
          {/* Status */}
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Status
            </p>
            <div className="flex items-center gap-2">
              {form.isPublic ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">
                    Public
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-xs text-zinc-400 font-medium">
                    Draft
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Draft
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            Publish
          </button>

          {mode === 'edit' && characterId && (
            <>
              <a
                href={`http://localhost:3000/characters/${characterId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <ExternalLink size={12} />
                Preview on Site
              </a>

              <div className="border-t border-zinc-800 pt-4">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                  Delete Character
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
