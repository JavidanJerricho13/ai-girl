'use client';

import { useState } from 'react';
import {
  DollarSign,
  Users,
  MessageSquare,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';

// ── Mock Data ────────────────────────────────────────────

type DateRange = '7d' | '30d' | '12m';

function generateRevenueData(range: DateRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 12;
  return Array.from({ length: days }, (_, i) => {
    const label =
      range === '12m'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
        : `Day ${i + 1}`;
    return {
      label,
      purchases: 200 + Math.floor(Math.random() * 300),
      spent: 80 + Math.floor(Math.random() * 150),
    };
  });
}

function generateUserData(range: DateRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 12;
  return Array.from({ length: days }, (_, i) => ({
    label: range === '12m'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
      : `${i + 1}`,
    active: 40 + Math.floor(Math.random() * 60),
    newUsers: 5 + Math.floor(Math.random() * 20),
  }));
}

const CHARACTER_DATA = [
  { name: 'Luna', value: 4200, color: '#6366f1' },
  { name: 'Atlas', value: 3100, color: '#8b5cf6' },
  { name: 'Aria', value: 2800, color: '#a78bfa' },
  { name: 'Nova', value: 1900, color: '#c4b5fd' },
  { name: 'Others', value: 3500, color: '#3f3f46' },
];

const TRANSACTIONS = [
  { id: '1', user: 'alice@mail.com', type: 'PURCHASE', amount: 500, time: '2m ago' },
  { id: '2', user: 'bob@mail.com', type: 'SPEND', amount: -10, time: '15m ago' },
  { id: '3', user: 'charlie@mail.com', type: 'PURCHASE', amount: 1200, time: '1h ago' },
  { id: '4', user: 'diana@mail.com', type: 'SPEND', amount: -3, time: '2h ago' },
  { id: '5', user: 'eve@mail.com', type: 'SUBSCRIPTION', amount: 1000, time: '3h ago' },
];

const SERVICES = [
  { name: 'API Server', status: 'ok' as const, latency: '42ms' },
  { name: 'Database', status: 'ok' as const, latency: '3ms' },
  { name: 'WebSocket', status: 'ok' as const, latency: '1ms' },
  { name: 'fal.ai (Images)', status: 'ok' as const, latency: '~2s' },
  { name: 'ElevenLabs (TTS)', status: 'ok' as const, latency: '~1s' },
  { name: 'Groq (LLM)', status: 'ok' as const, latency: '~0.5s' },
];

// ── Chart Tooltips ───────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-zinc-400 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>('30d');

  const revenueData = generateRevenueData(range);
  const userData = generateUserData(range);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium">Live</span>
          </div>
        </div>

        {/* Date range picker */}
        <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
          {(['7d', '30d', '12m'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value="$8,420"
          change={12.3}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          title="New Users"
          value="347"
          change={8.1}
          icon={<Users size={18} />}
        />
        <StatCard
          title="Message Volume"
          value="28.4k"
          change={5.4}
          icon={<MessageSquare size={18} />}
        />
        <StatCard
          title="Active Sessions"
          value="89"
          change={-2.3}
          icon={<Zap size={18} />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Credits: Purchases vs Consumption
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                interval={range === '30d' ? 6 : undefined}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="purchases"
                name="Purchased"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#purchGrad)"
              />
              <Area
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke="#f43f5e"
                strokeWidth={1.5}
                fill="url(#spentGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Character donut */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Top Characters
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={CHARACTER_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {CHARACTER_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {CHARACTER_DATA.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-xs text-zinc-400">{c.name}</span>
                </div>
                <span className="text-xs font-mono text-zinc-300">
                  {c.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* User activity bar chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            User Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userData} barGap={2}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                interval={range === '30d' ? 6 : undefined}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="active"
                name="Active"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="newUsers"
                name="New Users"
                fill="#8b5cf6"
                radius={[3, 3, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              System Health
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-900/30 px-2 py-0.5 rounded">
              All Operational
            </span>
          </div>
          <div className="space-y-3">
            {SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      svc.status === 'ok'
                        ? 'bg-emerald-400'
                        : svc.status === 'warn'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }`}
                  />
                  <span className="text-xs text-zinc-300">{svc.name}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {svc.latency}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Transactions */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">
            Recent Transactions
          </h3>
          <a
            href="/logs"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View All →
          </a>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? 'bg-emerald-900/30' : 'bg-red-900/30'
                  }`}
                >
                  {tx.amount > 0 ? (
                    <ArrowUp size={12} className="text-emerald-400" />
                  ) : (
                    <ArrowDown size={12} className="text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-zinc-300">{tx.user}</p>
                  <p className="text-[10px] text-zinc-500">{tx.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-xs font-mono font-medium ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount}
                </p>
                <p className="text-[10px] text-zinc-600">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
