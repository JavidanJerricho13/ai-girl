'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';

export default function Home() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const pingBackend = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    
    try {
      const response = await apiClient.get('/health');
      setStatus(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Ethereal AI Companion Platform
        </h1>
        
        <div className="flex flex-col items-center gap-4 p-8 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-lg text-center mb-4">
            Slice 1: Skeleton & Ping Test
          </p>
          
          <button
            onClick={pingBackend}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Pinging...' : 'Ping Backend'}
          </button>
          
          {status && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-lg w-full">
              <h3 className="text-green-400 font-semibold mb-2">✅ Success!</h3>
              <pre className="text-xs text-green-200 overflow-auto">
                {status}
              </pre>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg w-full">
              <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
              <p className="text-xs text-red-200">{error}</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Expected API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
          <p className="mt-2">Make sure the NestJS backend is running on port 3001</p>
        </div>
      </div>
    </main>
  );
}
