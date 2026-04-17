'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Globe, Moon, Bell, Shield, ChevronRight, Check, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { AgeGate } from '@/components/auth/AgeGate';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  language: string;
  nsfwEnabled: boolean;
  ageVerified: boolean;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAgeGate, setShowAgeGate] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/profile');
      return res.data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.patch('/users/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (data.language) updateUser({ language: data.language });
    },
  });

  const language = profile?.language ?? user?.language ?? 'en';
  const nsfwEnabled = profile?.nsfwEnabled ?? false;
  const ageVerified = profile?.ageVerified ?? false;

  const handleLanguageChange = (lang: string) => {
    updateProfile.mutate({ language: lang });
  };

  const handleNsfwToggle = () => {
    if (!nsfwEnabled && !ageVerified) {
      setShowAgeGate(true);
      return;
    }
    updateProfile.mutate({ nsfwEnabled: !nsfwEnabled });
  };

  return (
    <div className="max-w-lg mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-lilac" />
        <h1 className="font-display text-fluid-lg text-white">Settings</h1>
      </div>

      {/* Language */}
      <section className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Globe size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Language</span>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { code: 'en', label: 'English' },
            { code: 'az', label: 'Az\u0259rbaycanca' },
          ].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              disabled={updateProfile.isPending}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-sm text-gray-200">{label}</span>
              {language === code && <Check size={16} className="text-lilac" />}
            </button>
          ))}
        </div>
      </section>

      {/* Content preferences */}
      <section className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Shield size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Content</span>
        </div>
        <button
          onClick={handleNsfwToggle}
          disabled={updateProfile.isPending}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div>
            <p className="text-sm text-gray-200 text-left">NSFW Content</p>
            <p className="text-xs text-gray-500 text-left mt-0.5">
              {ageVerified ? 'Age verified' : 'Requires age verification'}
            </p>
          </div>
          <div
            className={`w-10 h-6 rounded-full transition-colors relative ${
              nsfwEnabled ? 'bg-lilac' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                nsfwEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </div>
        </button>
      </section>

      {/* Notifications placeholder */}
      <section className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Bell size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Notifications</span>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>
      </section>

      {/* App info */}
      <div className="text-center pt-4">
        <p className="text-fluid-xs text-gray-600">Ethereal v1.0.0</p>
      </div>

      {/* Age gate modal */}
      {showAgeGate && (
        <AgeGate
          onVerified={() => {
            setShowAgeGate(false);
            updateProfile.mutate({ nsfwEnabled: true });
          }}
          onCancel={() => setShowAgeGate(false)}
        />
      )}
    </div>
  );
}
