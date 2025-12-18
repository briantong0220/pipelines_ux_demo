'use client';

import { UserRole } from '@/types';
import RoleSwitcher from './RoleSwitcher';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function Header({ currentRole, onRoleChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UX Demo</h1>
            <p className="text-sm text-gray-600">Pipelines and tasks builder</p>
          </div>
          <RoleSwitcher currentRole={currentRole} onRoleChange={onRoleChange} />
        </div>
      </div>
    </header>
  );
}
