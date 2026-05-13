'use client';

import { UserRole } from '@/lib/types';
import { Shield, User } from 'lucide-react';

interface ViewToggleProps {
  currentView: UserRole;
  onViewChange: (view: UserRole) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-[#DBE2EB] rounded-[8px] p-1">
      <button
        onClick={() => onViewChange('gerencial')}
        className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${
          currentView === 'gerencial'
            ? 'bg-white text-[#993935] shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
            : 'text-[#6B7381] hover:text-[#2B2E35]'
        }`}
      >
        <Shield className="w-4 h-4" />
        Vista Gerencial
      </button>
      <button
        onClick={() => onViewChange('consultor')}
        className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${
          currentView === 'consultor'
            ? 'bg-white text-[#993935] shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
            : 'text-[#6B7381] hover:text-[#2B2E35]'
        }`}
      >
        <User className="w-4 h-4" />
        Vista Consultor
      </button>
    </div>
  );
}