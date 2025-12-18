'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import Header from '@/components/header/Header';
import AdminView from '@/components/admin/AdminView';
import EditorView from '@/components/editor/EditorView';
import ReviewerView from '@/components/reviewer/ReviewerView';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentRole={currentRole} onRoleChange={setCurrentRole} />
      <main className="container mx-auto px-4 py-8">
        {currentRole === 'admin' && <AdminView />}
        {currentRole === 'editor' && <EditorView />}
        {currentRole === 'reviewer' && <ReviewerView />}
      </main>
    </div>
  );
}
