import {
  DollarSign,
  Users,
  Image,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

const MOCK_TRANSACTIONS = [
  { id: '1', user: 'alice@mail.com', type: 'PURCHASE', amount: 500, date: '2 min ago' },
  { id: '2', user: 'bob@mail.com', type: 'SPEND', amount: -10, date: '15 min ago' },
  { id: '3', user: 'charlie@mail.com', type: 'PURCHASE', amount: 1200, date: '1 hr ago' },
  { id: '4', user: 'diana@mail.com', type: 'SPEND', amount: -3, date: '2 hr ago' },
  { id: '5', user: 'eve@mail.com', type: 'SUBSCRIPTION', amount: 1000, date: '3 hr ago' },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value="$8,420"
          change={12.3}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          title="Active Users (24h)"
          value="1,203"
          change={-1.1}
          icon={<Users size={18} />}
        />
        <StatCard
          title="Images Generated"
          value="3,891"
          change={5.4}
          icon={<Image size={18} />}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          change={0}
          icon={<Activity size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">
              Recent Transactions
            </h3>
            <a
              href="/logs"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View All
            </a>
          </div>
          <div className="divide-y divide-gray-800/50">
            {MOCK_TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      tx.amount > 0
                        ? 'bg-emerald-900/30'
                        : 'bg-red-900/30'
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowUp size={12} className="text-emerald-400" />
                    ) : (
                      <ArrowDown size={12} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-300">{tx.user}</p>
                    <p className="text-[10px] text-gray-500">{tx.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-medium ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount}
                  </p>
                  <p className="text-[10px] text-gray-600">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">System Status</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { name: 'API Server', status: 'Healthy', latency: '42ms' },
              { name: 'Database', status: 'Healthy', latency: '3ms' },
              { name: 'WebSocket', status: 'Healthy', latency: '1ms' },
              { name: 'fal.ai (Image Gen)', status: 'Healthy', latency: '~2s' },
              { name: 'ElevenLabs (TTS)', status: 'Healthy', latency: '~1s' },
            ].map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-gray-300">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{svc.latency}</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
