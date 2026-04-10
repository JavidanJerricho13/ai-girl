import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="text-center py-20">
      <Settings size={48} className="text-gray-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">
        System Settings
      </h2>
      <p className="text-sm text-gray-500">
        Configuration and system preferences coming next.
      </p>
    </div>
  );
}
