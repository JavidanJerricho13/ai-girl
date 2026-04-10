import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const trend =
    change === undefined
      ? null
      : change > 0
        ? 'up'
        : change < 0
          ? 'down'
          : 'flat';

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="text-gray-600">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {trend !== null && change !== undefined && (
        <div className="flex items-center gap-1">
          {trend === 'up' && (
            <TrendingUp size={12} className="text-emerald-400" />
          )}
          {trend === 'down' && (
            <TrendingDown size={12} className="text-red-400" />
          )}
          {trend === 'flat' && (
            <Minus size={12} className="text-gray-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                  ? 'text-red-400'
                  : 'text-gray-500'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
          <span className="text-xs text-gray-600">vs last period</span>
        </div>
      )}
    </div>
  );
}
