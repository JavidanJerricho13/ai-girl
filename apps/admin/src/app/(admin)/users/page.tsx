import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="text-center py-20">
      <UserCog size={48} className="text-gray-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">
        User Management
      </h2>
      <p className="text-sm text-gray-500">
        User list, roles, and account management coming next.
      </p>
    </div>
  );
}
