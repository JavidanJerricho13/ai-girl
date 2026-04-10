import { Users } from 'lucide-react';

export default function CharactersPage() {
  return (
    <div className="text-center py-20">
      <Users size={48} className="text-gray-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">
        Character Management
      </h2>
      <p className="text-sm text-gray-500">
        Character list, creation, and moderation tools coming next.
      </p>
    </div>
  );
}
