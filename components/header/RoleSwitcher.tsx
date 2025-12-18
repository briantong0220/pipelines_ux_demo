'use client';

import { UserRole } from '@/types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Editor' },
    { value: 'reviewer', label: 'Reviewer' },
  ];

  return (
    <div className="flex gap-2">
      {roles.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onRoleChange(value)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentRole === value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
