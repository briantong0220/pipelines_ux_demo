'use client';

import { UserRole } from '@/types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Create & manage pipelines' },
  { value: 'editor', label: 'Editor', description: 'Complete annotation tasks' },
  { value: 'reviewer', label: 'Reviewer', description: 'Review & approve work' },
];

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const currentRoleData = roles.find(r => r.value === currentRole) || roles[0];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">View as:</span>
      <div className="relative">
        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-gray-900 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {roles.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <span className="text-xs text-gray-400 hidden sm:block">
        {currentRoleData.description}
      </span>
    </div>
  );
}
