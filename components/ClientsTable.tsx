'use client';

import { ClienteSinMovimiento, ClienteNuevo } from '@/lib/types';
import { UserX, UserPlus } from 'lucide-react';

interface ClientsTableProps {
  tipo: 'sin-movimiento' | 'nuevos';
  clientes: (ClienteSinMovimiento | ClienteNuevo)[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function ClientsTable({ tipo, clientes }: ClientsTableProps) {
  const isSinMovimiento = tipo === 'sin-movimiento';

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isSinMovimiento ? (
            <UserX className="w-4 h-4 text-[#EB5852]" />
          ) : (
            <UserPlus className="w-4 h-4 text-[#73DEA9]" />
          )}
          <h3 className="text-sm font-bold text-[#2B2E35]">
            {isSinMovimiento ? 'Clientes sin movimiento (+30 días)' : 'Clientes nuevos'}
          </h3>
        </div>
        <span className={`text-sm font-bold ${isSinMovimiento ? 'text-[#EB5852]' : 'text-[#73DEA9]'}`}>
          {clientes.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DBE2EB]">
              <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Cliente</th>
              <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Zona</th>
              {isSinMovimiento && (
                <>
                  <th className="text-center py-2 px-2 font-medium text-[#6B7381]">Días sin compra</th>
                  <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Potencial</th>
                </>
              )}
              {!isSinMovimiento && (
                <>
                  <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Fecha creación</th>
                  <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Primera compra</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-[#DBE2EB] hover:bg-[#DBE2EB]">
                <td className="py-2 px-2 font-medium text-[#2B2E35]">{cliente.nombre}</td>
                <td className="py-2 px-2 text-[#8B8B8D]">{cliente.zona}</td>
                {isSinMovimiento && (
                  <>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-[999px] ${
                        (cliente as ClienteSinMovimiento).diasSinCompra > 40 ? 'bg-[#EB5852]/10 text-[#EB5852]' :
                        (cliente as ClienteSinMovimiento).diasSinCompra > 35 ? 'bg-[#FFA600]/10 text-[#6B4C00]' :
                        'bg-[#82BDFF]/10 text-[#2B2E35]'
                      }`}>
                        {(cliente as ClienteSinMovimiento).diasSinCompra}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-[#2B2E35]">
                      {formatCurrency((cliente as ClienteSinMovimiento).potencial)}
                    </td>
                  </>
                )}
                {!isSinMovimiento && (
                  <>
                    <td className="py-2 px-2 text-[#8B8B8D]">{(cliente as ClienteNuevo).fechaCreacion}</td>
                    <td className="py-2 px-2 text-right text-[#2B2E35]">
                      {formatCurrency((cliente as ClienteNuevo).primeraCompra)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}