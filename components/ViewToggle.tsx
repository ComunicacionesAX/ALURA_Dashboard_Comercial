'use client';

import { UserRole } from '@/lib/types';
import { Shield, User } from 'lucide-react';

interface ViewToggleProps {
  currentView: UserRole;
  onViewChange: (view: UserRole) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewChange('gerencial')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          currentView === 'gerencial'
            ? 'bg-white text-[#702b2b] shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Shield className="w-4 h-4" />
        Vista Gerencial
      </button>
      <button
        onClick={() => onViewChange('consultor')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          currentView === 'consultor'
            ? 'bg-white text-[#702b2b] shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <User className="w-4 h-4" />
        Vista Consultor
      </button>
    </div>
  );
}