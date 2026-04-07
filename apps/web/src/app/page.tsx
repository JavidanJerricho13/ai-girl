'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { MessageSquare, Sparkles, Lock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If already authenticated, redirect to chat
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-6 border border-white/20">
              <Sparkles className="w-16 h-16 text-purple-300" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4">
            Welcome to Ethereal
          </h1>
          
          <p className="text-xl text-gray-200 mb-8">
            Your Personal AI Companion Platform
          </p>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Experience intelligent conversations with AI characters powered by
            advanced language models. Each conversation is remembered and
            personalized just for you.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <MessageSquare className="w-10 h-10 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Intelligent Chat
            </h3>
            <p className="text-gray-300 text-sm">
              Real-time conversations with AI characters using streaming responses
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Lock className="w-10 h-10 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Memory System
            </h3>
            <p className="text-gray-300 text-sm">
              Advanced RAG system remembers your conversations and context
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Multiple Characters
            </h3>
            <p className="text-gray-300 text-sm">
              Chat with different AI personalities and characters
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          
          <Link
            href="/login"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-400 text-sm">
          <p>Powered by Advanced AI • Secure & Private • Built with Love</p>
        </div>
      </div>
    </div>
  );
}
