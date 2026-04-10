import { BarChart3 } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="text-center py-20">
      <BarChart3 size={48} className="text-gray-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">
        Financial Logs
      </h2>
      <p className="text-sm text-gray-500">
        Transaction history and revenue analytics coming next.
      </p>
    </div>
  );
}
