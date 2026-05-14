'use client';

import { Alerta } from '@/lib/types';
import { AlertTriangle, AlertCircle, Info, ChevronRight, CheckCircle } from 'lucide-react';

// Bold numbers/percentages and the subject after a colon in alert text
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\d+(?:[.,]\d+)?%?|\d+(?:\.\d+)?)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part)
          ? <strong key={i} className="font-semibold">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

interface AlertsProps {
  alertas: Alerta[];
  onVerTodas?: () => void;
}

const nivelConfig = {
  critica: {
    bg: 'bg-[#EB5852]/10',
    border: 'border-[#EB5852]',
    text: 'text-[#EB5852]',
    badgeBg: 'bg-[#EB5852]/20',
    icon: AlertTriangle,
  },
  alta: {
    bg: 'bg-[#FFA600]/10',
    border: 'border-[#FFA600]',
    text: 'text-[#6B4C00]',
    badgeBg: 'bg-[#FFA600]/20',
    icon: AlertCircle,
  },
  media: {
    bg: 'bg-[#82BDFF]/10',
    border: 'border-[#82BDFF]',
    text: 'text-[#2B2E35]',
    badgeBg: 'bg-[#82BDFF]/20',
    icon: Info,
  },
};

const tipoLabels: Record<string, string> = {
  otif: 'OTIF',
  inventario: 'Inventario',
  cliente: 'Cliente',
  margen: 'Margen',
  queja: 'Queja',
};

export default function Alerts({ alertas, onVerTodas }: AlertsProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)] h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#2B2E35]">Alertas del día</h3>
        {onVerTodas && alertas.length > 0 && (
          <button onClick={onVerTodas} className="text-xs text-[#993935] hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {alertas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
          <div className="w-10 h-10 rounded-full bg-[#73DEA9]/15 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[#73DEA9]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#2B2E35]">Sin alertas activas</p>
            <p className="text-xs text-[#8B8B8D] mt-0.5">Todo en orden por ahora</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {alertas.map((alerta) => {
            const config = nivelConfig[alerta.nivel];
            const Icon = config.icon;
            return (
              <div
                key={alerta.id}
                className={`flex items-start gap-3 p-3 rounded-[6px] border-l-4 ${config.bg} ${config.border} ${config.text}`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{tipoLabels[alerta.tipo] ?? alerta.tipo}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-[999px] font-medium ${config.badgeBg}`}>
                      {alerta.nivel}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {alerta.titulo.includes(':') ? (
                      <>
                        {alerta.titulo.split(':')[0]}:{' '}
                        <strong className="font-semibold">{alerta.titulo.split(':').slice(1).join(':').trim()}</strong>
                      </>
                    ) : alerta.titulo}
                  </p>
                  <p className="text-xs mt-0.5 opacity-75">
                    <RichText text={alerta.descripcion} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
