'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

// ── Shared trigger + dropdown class tokens ────────────────────────────────────
const TRIGGER =
  'w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] pl-3 pr-9 py-2 text-left focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors cursor-pointer';

const DROPDOWN =
  'absolute z-50 mt-1 left-0 w-full bg-white border border-[#DBE2EB] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1 max-h-72 overflow-y-auto';

const ITEM_BASE =
  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#EFF2F6]';

// ── Hook: close on outside click ──────────────────────────────────────────────
function useOutsideClose(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, ref, onClose]);
}

// ── SingleSelect ──────────────────────────────────────────────────────────────
interface SingleSelectProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
}

export function SingleSelect({ value, options, placeholder = 'Todos', onChange }: SingleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));

  const select = (v: string) => { onChange(v); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={TRIGGER}>
        <span className="block truncate">{value || placeholder}</span>
      </button>
      <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7381] transition-transform ${open ? 'rotate-180' : ''}`} />

      {open && (
        <div className={DROPDOWN}>
          <button type="button" onClick={() => select('')}
            className={`${ITEM_BASE} ${value === '' ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'}`}>
            <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
              {value === '' && <Check className="w-3.5 h-3.5" />}
            </span>
            {placeholder}
          </button>

          {options.length > 0 && <div className="my-1 border-t border-[#EFF2F6]" />}

          {options.map(opt => (
            <button key={opt} type="button" onClick={() => select(opt)}
              className={`${ITEM_BASE} ${value === opt ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'}`}>
              <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                {value === opt && <Check className="w-3.5 h-3.5" />}
              </span>
              <span className="truncate">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MultiSelect ───────────────────────────────────────────────────────────────
interface MultiSelectProps {
  value: string[];
  options: string[];
  placeholder?: string;
  onChange: (v: string[]) => void;
}

export function MultiSelect({ value, options, placeholder = 'Todos', onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));

  const toggle = (p: string) => {
    onChange(value.includes(p) ? value.filter(x => x !== p) : [...value, p]);
  };

  const label =
    value.length === 0 ? placeholder :
    value.length === 1 ? value[0] :
    `${value.length} seleccionados`;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={TRIGGER}>
        <span className="block truncate">{label}</span>
      </button>
      <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7381] transition-transform ${open ? 'rotate-180' : ''}`} />

      {open && options.length > 0 && (
        <div className={DROPDOWN}>
          {value.length > 0 && (
            <>
              <button type="button" onClick={() => onChange([])}
                className={`${ITEM_BASE} text-[#8B8B8D]`}>
                <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </span>
                Limpiar selección
              </button>
              <div className="my-1 border-t border-[#EFF2F6]" />
            </>
          )}

          {options.map(opt => {
            const checked = value.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`${ITEM_BASE} ${checked ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'}`}>
                <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
                  checked ? 'bg-[#993935] border-[#993935]' : 'border-[#CCCCCC] bg-white'
                }`}>
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
