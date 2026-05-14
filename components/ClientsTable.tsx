'use client';

import { useState } from 'react';
import { ClienteSinMovimiento, ClienteNuevo } from '@/lib/types';
import { formatCOP } from '@/lib/format';
import { UserX, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientsTableProps {
  tipo: 'sin-movimiento' | 'nuevos';
  clientes: (ClienteSinMovimiento | ClienteNuevo)[];
}

const PAGE_SIZE = 5;

export default function ClientsTable({ tipo, clientes }: ClientsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const isSinMovimiento = tipo === 'sin-movimiento';
  const visible = expanded ? clientes : clientes.slice(0, PAGE_SIZE);

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
        <span className={`text-xs font-bold px-2 py-0.5 rounded-[999px] ${
          isSinMovimiento ? 'bg-[#EB5852]/10 text-[#EB5852]' : 'bg-[#73DEA9]/15 text-[#2B2E35]'
        }`}>
          {clientes.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DBE2EB]">
              <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Cliente</th>
              <th className="hidden sm:table-cell text-left py-2 px-2 font-medium text-[#6B7381]">Zona / Consultor</th>
              {isSinMovimiento ? (
                <>
                  <th className="text-center py-2 px-2 font-medium text-[#6B7381]">Días sin compra</th>
                  <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Potencial/mes</th>
                </>
              ) : (
                <>
                  <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Fecha ingreso</th>
                  <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Primera compra</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((cliente) => (
              <tr key={cliente.id} className="border-b border-[#DBE2EB] last:border-0 hover:bg-[#EFF2F6] transition-colors">
                <td className="py-2 px-2 font-medium text-[#2B2E35] max-w-[180px] truncate">{cliente.nombre}</td>
                <td className="hidden sm:table-cell py-2 px-2 text-[#8B8B8D] text-xs">{cliente.zona}</td>
                {isSinMovimiento ? (
                  <>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-[999px] font-medium ${
                        (cliente as ClienteSinMovimiento).diasSinCompra > 60  ? 'bg-[#EB5852]/10 text-[#EB5852]' :
                        (cliente as ClienteSinMovimiento).diasSinCompra > 45  ? 'bg-[#FFA600]/10 text-[#6B4C00]' :
                        'bg-[#82BDFF]/10 text-[#2B2E35]'
                      }`}>
                        {(cliente as ClienteSinMovimiento).diasSinCompra} días
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-[#2B2E35]">
                      {formatCOP((cliente as ClienteSinMovimiento).potencial)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2 text-[#8B8B8D] text-xs">{(cliente as ClienteNuevo).fechaCreacion}</td>
                    <td className="py-2 px-2 text-right font-medium text-[#2B2E35]">
                      {formatCOP((cliente as ClienteNuevo).primeraCompra)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clientes.length > PAGE_SIZE && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-[#6B7381] hover:text-[#993935] py-1.5 border-t border-[#DBE2EB] transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Ver {clientes.length - PAGE_SIZE} más</>
          )}
        </button>
      )}
    </div>
  );
}
