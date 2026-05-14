'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { DashboardData } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBotProps {
  data?: DashboardData | null;
}

function fmt(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}Bn`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

function generateResponse(question: string, data?: DashboardData | null): string {
  const q = question.toLowerCase();

  if (!data) {
    return 'Los datos aún no están disponibles. Por favor espera a que cargue el dashboard e intenta de nuevo.';
  }

  if (q.includes('venta') || q.includes('vend')) {
    const v = data.kpis.ventaMes;
    const diff = v.previousValue > 0 ? ((v.value - v.previousValue) / v.previousValue * 100).toFixed(1) : '—';
    return `La venta del mes actual es ${fmt(v.value)}. Comparado con el mes anterior (${fmt(v.previousValue)}), eso es un ${Number(diff) >= 0 ? '+' : ''}${diff}%.`;
  }

  if (q.includes('margen') || q.includes('rentabilidad')) {
    const m = data.kpis.margenBruto;
    if (data.ventasPorZona.length > 0) {
      const peor = data.ventasPorZona.reduce((min, z) => z.margen < min.margen ? z : min);
      return `El margen bruto es ${m.value.toFixed(1)}%. La zona con menor margen es ${peor.zona} (${peor.margen.toFixed(1)}%).`;
    }
    return `El margen bruto / cumplimiento de presupuesto es ${m.value.toFixed(1)}%.`;
  }

  if (q.includes('cumplimiento') || q.includes('ppto') || q.includes('presupuesto')) {
    const m = data.kpis.margenBruto;
    if (data.ventasPorZona.length > 0) {
      const sorted = [...data.ventasPorZona].sort((a, b) => b.cumplimiento - a.cumplimiento);
      const mejor = sorted[0];
      const peor  = sorted[sorted.length - 1];
      return `Cumplimiento global: ${m.value.toFixed(1)}%. Mejor zona: ${mejor.zona} (${mejor.cumplimiento.toFixed(1)}%). Zona con más oportunidad: ${peor.zona} (${peor.cumplimiento.toFixed(1)}%).`;
    }
    return `El cumplimiento de presupuesto actual es ${m.value.toFixed(1)}%.`;
  }

  if (q.includes('otif') || q.includes('entrega')) {
    const otif = data.kpis.otif;
    return `El OTIF actual es del ${otif.value.toFixed(1)}% (meta: 95%). Comparado con el mes anterior: ${otif.previousValue.toFixed(1)}%.`;
  }

  if (q.includes('inventario') || q.includes('stock') || q.includes('bodega')) {
    if (data.inventario.length > 0) {
      const total = data.inventario.reduce((s, b) => s + b.stockPremix, 0);
      const alerta = data.kpis.alertasInventario.value;
      return `Stock total Premix en bodegas: ${(total / 1000).toFixed(0)} toneladas. Hay ${alerta} alertas de inventario activas.`;
    }
    return `El módulo de inventario aún no tiene datos conectados.`;
  }

  if (q.includes('cliente') && (q.includes('nuev') || q.includes('nuevo'))) {
    const k = data.kpis.clientesNuevos;
    if (data.clientesNuevos.length > 0) {
      const top = data.clientesNuevos.slice(0, 3).map(c => c.nombre).join(', ');
      return `Este año se han registrado ${k.value} clientes nuevos. Los más recientes: ${top}.`;
    }
    return `Se han registrado ${k.value} clientes nuevos este año.`;
  }

  if (q.includes('sin movimiento') || q.includes('inactivo') || q.includes('sin compra')) {
    const k = data.kpis.clientesSinMovimiento;
    if (data.clientesSinMovimiento.length > 0) {
      const top = data.clientesSinMovimiento.slice(0, 3);
      const lista = top.map(c => `${c.nombre} (${c.diasSinCompra} días)`).join(', ');
      return `Hay ${k.value} clientes sin compra en el mes actual que compraron el año pasado. Los más críticos: ${lista}.`;
    }
    return `Hay ${k.value} clientes sin movimiento registrados.`;
  }

  if (q.includes('queja') || q.includes('reclamo')) {
    return `Las quejas del mes muestran ${data.kpis.quejas.value} registros. El módulo de detalle aún no tiene fuente conectada.`;
  }

  if (q.includes('nota') || q.includes('crédito')) {
    return `Notas crédito del mes: ${fmt(data.kpis.notasCredito.value)}. El detalle de notas está pendiente de conexión.`;
  }

  if (q.includes('zona') || q.includes('región') || q.includes('equipo')) {
    if (data.ventasPorZona.length > 0) {
      const sorted = [...data.ventasPorZona].sort((a, b) => b.cumplimiento - a.cumplimiento);
      const mejor = sorted[0];
      const peor  = sorted[sorted.length - 1];
      return `${data.ventasPorZona.length} zonas/consultores activos. Mejor cumplimiento: ${mejor.zona} (${mejor.cumplimiento.toFixed(1)}%). Requiere atención: ${peor.zona} (${peor.cumplimiento.toFixed(1)}%).`;
    }
    return 'No hay datos de zonas disponibles aún.';
  }

  if (q.includes('producto') || q.includes('top') || q.includes('mejor')) {
    if (data.ventasPorProducto.length > 0) {
      const top3 = data.ventasPorProducto.slice(0, 3);
      return `Top 3 productos por venta: 1) ${top3[0].producto} (${fmt(top3[0].venta)}), 2) ${top3[1]?.producto ?? '—'} (${fmt(top3[1]?.venta ?? 0)}), 3) ${top3[2]?.producto ?? '—'} (${fmt(top3[2]?.venta ?? 0)}).`;
    }
    return 'No hay datos de productos disponibles aún.';
  }

  if (q.includes('alerta') || q.includes('atención') || q.includes('crítico')) {
    const sinMov = data.kpis.clientesSinMovimiento.value;
    const invAlerta = data.kpis.alertasInventario.value;
    return `Resumen de alertas: ${sinMov} clientes sin movimiento, ${invAlerta} alertas de inventario, OTIF en ${data.kpis.otif.value.toFixed(1)}%.`;
  }

  return 'Puedo ayudarte con: ventas, margen, cumplimiento de presupuesto, OTIF, inventario, clientes (nuevos / sin movimiento), zonas o productos. ¿Qué necesitas?';
}

export default function ChatBot({ data }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy el asistente comercial CTC. Puedo consultarte datos de ventas, margen, OTIF, inventario y clientes. ¿Qué quieres saber?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateResponse(input, data);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#993935] hover:bg-[#7a2e2b] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Asistente CTC</span>
        </button>
      ) : (
        <div className="bg-white rounded-[12px] shadow-2xl border border-[#DBE2EB] w-[380px] h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#993935] rounded-t-[12px]">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">Asistente Comercial CTC</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-[#993935]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#993935]" />
                  </div>
                )}
                <div className={`max-w-[78%] rounded-[10px] px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#993935] text-white rounded-br-[3px]'
                    : 'bg-[#EFF2F6] text-[#2B2E35] rounded-bl-[3px]'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#DBE2EB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#6B7381]" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-[#993935]/10 rounded-full flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-[#993935]" />
                </div>
                <div className="bg-[#EFF2F6] rounded-[10px] rounded-bl-[3px] px-3 py-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#DBE2EB]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre ventas, margen, clientes…"
                className="flex-1 text-sm text-[#2B2E35] placeholder-[#8B8B8D] bg-[#EFF2F6] border border-[#DBE2EB] rounded-[8px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#993935] hover:bg-[#7a2e2b] disabled:bg-[#DBE2EB] disabled:text-[#8B8B8D] text-white p-2 rounded-[8px] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
