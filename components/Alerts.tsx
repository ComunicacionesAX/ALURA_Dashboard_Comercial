'use client';

import { Alerta } from '@/lib/types';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';

interface AlertsProps {
  alertas: Alerta[];
  onVerTodas?: () => void;
}

const nivelConfig = {
  critica: { color: 'bg-red-100 border-red-500 text-red-800', icon: AlertTriangle },
  alta: { color: 'bg-orange-100 border-orange-500 text-orange-800', icon: AlertCircle },
  media: { color: 'bg-yellow-100 border-yellow-500 text-yellow-800', icon: Info },
};

const tipoLabels = {
  otif: 'OTIF',
  inventario: 'Inventario',
  cliente: 'Cliente',
  margen: 'Margen',
  queja: 'Queja',
};

export default function Alerts({ alertas, onVerTodas }: AlertsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Alertas del día</h3>
        {onVerTodas && (
          <button onClick={onVerTodas} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {alertas.map((alerta) => {
          const config = nivelConfig[alerta.nivel];
          const Icon = config.icon;
          return (
            <div
              key={alerta.id}
              className={`flex items-start gap-3 p-3 rounded-md border-l-4 ${config.color}`}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{tipoLabels[alerta.tipo]}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    alerta.nivel === 'critica' ? 'bg-red-200 text-red-800' :
                    alerta.nivel === 'alta' ? 'bg-orange-200 text-orange-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {alerta.nivel}
                  </span>
                </div>
                <p className="text-sm font-medium">{alerta.titulo}</p>
                <p className="text-xs text-gray-600 mt-0.5">{alerta.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}