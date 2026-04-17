'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Loader2, Save, Coins, Brain, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface SettingGroup {
  title: string;
  icon: React.ReactNode;
  fields: Array<{
    key: string;
    label: string;
    description: string;
    type: 'number' | 'text' | 'select' | 'toggle';
    options?: string[];
  }>;
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'Credit Economy',
    icon: <Coins size={18} className="text-emerald-400" />,
    fields: [
      { key: 'credits.chat_cost', label: 'Chat Message Cost', description: 'Credits per message', type: 'number' },
      { key: 'credits.image_cost', label: 'Image Generation Cost', description: 'Credits per image', type: 'number' },
      { key: 'credits.voice_cost', label: 'Voice Generation Cost', description: 'Credits per voice clip', type: 'number' },
      { key: 'credits.initial_balance', label: 'Initial Balance', description: 'Credits on registration', type: 'number' },
      { key: 'credits.daily_reward', label: 'Daily Reward', description: 'Credits per daily login', type: 'number' },
      { key: 'credits.guest_credits', label: 'Guest Credits', description: 'Credits for anonymous preview', type: 'number' },
    ],
  },
  {
    title: 'LLM Configuration',
    icon: <Brain size={18} className="text-indigo-400" />,
    fields: [
      { key: 'llm.model', label: 'Default Model', description: 'Groq model ID', type: 'text' },
      { key: 'llm.temperature', label: 'Temperature', description: '0.0 = deterministic, 1.0 = creative', type: 'text' },
      { key: 'llm.max_tokens', label: 'Max Tokens', description: 'Maximum response length', type: 'number' },
    ],
  },
  {
    title: 'Moderation',
    icon: <Shield size={18} className="text-amber-400" />,
    fields: [
      { key: 'moderation.auto_block_threshold', label: 'Auto-Block Threshold', description: 'Confidence level for automatic blocking (0.0-1.0)', type: 'text' },
      { key: 'moderation.nsfw_policy', label: 'NSFW Policy', description: 'Content restriction level', type: 'select', options: ['strict', 'moderate', 'permissive'] },
    ],
  },
  {
    title: 'Platform',
    icon: <Globe size={18} className="text-sky-400" />,
    fields: [
      { key: 'platform.maintenance_mode', label: 'Maintenance Mode', description: 'Disable access for non-admins', type: 'toggle' },
      { key: 'platform.registration_open', label: 'Registration Open', description: 'Allow new user signups', type: 'toggle' },
      { key: 'platform.guest_ttl_days', label: 'Guest TTL (days)', description: 'Days before guest accounts expire', type: 'number' },
    ],
  },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const hasChanges = settings && Object.keys(draft).some(k => draft[k] !== settings[k]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const changed: Record<string, string> = {};
      for (const [k, v] of Object.entries(draft)) {
        if (settings && v !== settings[k]) changed[k] = v;
      }
      await apiClient.patch('/admin/settings', changed);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(`Saved ${Object.keys(changed).length} setting(s)`);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">Platform Settings</h2>
            <p className="text-xs text-zinc-500">Configure credits, LLM, moderation, and platform behavior</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {/* Setting groups */}
      <div className="space-y-6">
        {SETTING_GROUPS.map(group => (
          <div key={group.title} className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800">
              {group.icon}
              <h3 className="text-sm font-semibold text-white">{group.title}</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {group.fields.map(field => (
                <div key={field.key} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0 mr-6">
                    <p className="text-sm text-zinc-200">{field.label}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{field.description}</p>
                  </div>
                  <div className="shrink-0">
                    {field.type === 'toggle' ? (
                      <button
                        onClick={() => updateField(field.key, draft[field.key] === 'true' ? 'false' : 'true')}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          draft[field.key] === 'true' ? 'bg-indigo-600' : 'bg-zinc-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          draft[field.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : field.type === 'select' ? (
                      <select
                        value={draft[field.key] ?? ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-600"
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={draft[field.key] ?? ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        className={`px-3 py-1.5 bg-zinc-800 border rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-600 transition-colors ${
                          settings && draft[field.key] !== settings[field.key]
                            ? 'border-indigo-500'
                            : 'border-zinc-700'
                        } ${field.type === 'number' ? 'w-24 text-right font-mono' : 'w-56'}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
