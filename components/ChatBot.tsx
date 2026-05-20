'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { DashboardData } from '@/lib/types';
import { formatCOP } from '@/lib/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatBotProps {
  data?: DashboardData | null;
  view?: 'gerencial' | 'consultor';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function abbr(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`;
  return formatCOP(v);
}

const pct = (v: number) => `${v.toFixed(1)}%`;

const DIACRITIC_RE = /[̀-ͯ]/g;
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(DIACRITIC_RE, '');

async function simulateStream(
  text: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  for (let i = 0; i < text.length; i += 6) {
    if (signal.aborted) return;
    onChunk(text.slice(i, i + 6));
    await new Promise<void>(r => setTimeout(r, 16));
  }
}

// ─── Response Generator ───────────────────────────────────────────────────────

function generateResponse(
  question: string,
  data: DashboardData,
  view: 'gerencial' | 'consultor',
): string {
  const q = norm(question);
  const has = (...terms: string[]) => terms.some(t => q.includes(norm(t)));

  // ── Ventas ──
  if (has('venta', 'ventas', 'vend', 'factur', 'ingres', 'como van')) {
    const v = data.kpis.ventaMes;
    const change = v.previousValue > 0
      ? ((v.value - v.previousValue) / v.previousValue * 100) : null;
    const changeTxt = change !== null
      ? (change >= 0
          ? ` (▲ +${change.toFixed(1)}% vs mes anterior)`
          : ` (▼ ${change.toFixed(1)}% vs mes anterior)`)
      : '';

    let resp = `La venta del mes es ${abbr(v.value)}${changeTxt}.`;
    if (v.previousValue > 0) resp += `\nMes anterior: ${abbr(v.previousValue)}.`;

    if (data.ventasPorZona.length > 0) {
      const sorted = data.ventasPorZona.toSorted((a, b) => b.venta - a.venta);
      const label = view === 'consultor' ? 'consultores' : 'zonas';
      resp += `\n\nTop ${label} por venta:\n` +
        sorted.slice(0, 5).map((z, i) =>
          `${i + 1}. ${z.zona}: ${abbr(z.venta)} (${pct(z.cumplimiento)} cumpl.)`
        ).join('\n');
    }
    return resp;
  }

  // ── Margen (gerencial only) ──
  if (has('margen', 'rentabilidad') && view === 'gerencial') {
    const m = data.kpis.margenBruto;
    const zonas = data.ventasPorZona.filter(z => z.venta > 0);

    if (has('peor', 'menor', 'bajo', 'critico', 'critica', 'minimo', 'peores')) {
      if (zonas.length > 0) {
        const sorted = zonas.toSorted((a, b) => a.margen - b.margen);
        let resp = `Zona con peor margen: ${sorted[0].zona} con ${pct(sorted[0].margen)}.`;
        if (sorted.length > 1) {
          resp += `\nZona con mejor margen: ${sorted[sorted.length - 1].zona} con ${pct(sorted[sorted.length - 1].margen)}.`;
          resp += `\n\nRanking por margen:\n` +
            sorted.slice(0, 6).map((z, i) =>
              `${i + 1}. ${z.zona}: ${pct(z.margen)} margen (${abbr(z.venta)})`
            ).join('\n');
        }
        resp += `\n\nMargen global: ${pct(m.value)}.`;
        return resp;
      }
    }

    let resp = `El margen bruto del período es ${pct(m.value)}`;
    const delta = m.previousValue > 0 ? m.value - m.previousValue : null;
    if (delta !== null) resp += ` (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp vs mes anterior)`;
    resp += '.';

    if (zonas.length > 0) {
      const sorted = zonas.toSorted((a, b) => a.margen - b.margen);
      resp += `\n\nZona con menor margen: ${sorted[0].zona} (${pct(sorted[0].margen)}).`;
      resp += `\nZona con mayor margen: ${sorted[sorted.length - 1].zona} (${pct(sorted[sorted.length - 1].margen)}).`;
    }

    const catD = data.ventasPorProducto.filter(p => p.categoria === 'D' && p.venta > 0);
    if (catD.length > 0) {
      resp += `\n\nProductos Cat. D (margen bajo): ${catD.slice(0, 3).map(p => `${p.producto} (${pct(p.margen)})`).join(', ')}.`;
    }
    return resp;
  }

  // ── Cumplimiento / Presupuesto ──
  if (has('cumplimiento', 'ppto', 'presupuesto', 'meta', 'objetivo') ||
      (view === 'consultor' && has('margen'))) {
    const m = data.kpis.margenBruto;
    const conPpto = data.ventasPorZona.filter(z => z.presupuesto > 0);
    const entityLabel = view === 'consultor' ? 'Consultor' : 'Zona';

    if (has('peor', 'menor', 'bajo', 'minimo', 'menos')) {
      if (conPpto.length > 0) {
        const sorted = conPpto.toSorted((a, b) => a.cumplimiento - b.cumplimiento);
        let resp = `${entityLabel} con menor cumplimiento: ${sorted[0].zona} con ${pct(sorted[0].cumplimiento)}.`;
        resp += `\n\nRanking (menor a mayor):\n` +
          sorted.slice(0, 6).map(z => {
            const icon = z.cumplimiento >= 100 ? '✓' : z.cumplimiento >= 80 ? '⚠' : '✗';
            return `${icon} ${z.zona}: ${pct(z.cumplimiento)} (${abbr(z.venta)} / ${abbr(z.presupuesto)})`;
          }).join('\n');
        return resp;
      }
    }

    let resp = `El cumplimiento del período es ${pct(m.value)}.`;
    if (conPpto.length > 0) {
      const cumpliendo = conPpto.filter(z => z.cumplimiento >= 100).length;
      resp += `\n${cumpliendo} de ${conPpto.length} ${view === 'consultor' ? 'consultores' : 'zonas'} están al 100% o más.`;
      const sorted = conPpto.toSorted((a, b) => a.cumplimiento - b.cumplimiento);
      resp += `\n\nMayor oportunidad: ${sorted[0].zona} (${pct(sorted[0].cumplimiento)}).`;
      resp += `\nMejor desempeño: ${sorted[sorted.length - 1].zona} (${pct(sorted[sorted.length - 1].cumplimiento)}).`;
    }
    return resp;
  }

  // ── OTIF ──
  if (has('otif', 'entrega', 'despacho', 'logistica', 'logistic')) {
    const otif = data.kpis.otif;
    const meta = 95;
    const gap  = otif.value - meta;
    const diff = otif.previousValue > 0 ? otif.value - otif.previousValue : null;

    let resp = `El OTIF actual es ${pct(otif.value)} (meta: ${pct(meta)}).`;
    resp += gap < 0
      ? `\nEstá ${Math.abs(gap).toFixed(1)}pp por debajo de la meta.`
      : `\nEstá ${gap.toFixed(1)}pp por encima de la meta.`;

    if (diff !== null) {
      resp += `\n\nMes anterior: ${pct(otif.previousValue)} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}pp).`;
    }

    const alertasOtif = data.alertas.filter(a => a.tipo === 'otif');
    if (alertasOtif.length > 0) {
      resp += `\n\nZonas con alerta OTIF: ${alertasOtif.map(a => a.zona ?? a.titulo).join(', ')}.`;
    }
    return resp;
  }

  // ── Clientes sin movimiento ──
  if (has('sin movimiento', 'inactiv', 'sin compra', 'dias sin', 'no compran', 'mas dias')) {
    const k = data.kpis.clientesSinMovimiento;
    if (k.value === 0 || data.clientesSinMovimiento.length === 0) {
      return `No hay clientes sin movimiento en el período actual. ¡Todo en orden!`;
    }
    const sorted = data.clientesSinMovimiento.toSorted((a, b) => b.diasSinCompra - a.diasSinCompra);
    return `Hay ${k.value} cliente(s) sin compra en el período actual.\n\nMayor inactividad:\n` +
      sorted.slice(0, 6).map((c, i) =>
        `${i + 1}. ${c.nombre} (${c.zona}): ${c.diasSinCompra} días sin compra`
      ).join('\n');
  }

  // ── Clientes nuevos ──
  if (has('cliente nuevo', 'clientes nuevos', 'nuev', 'quienes son los clientes')) {
    const k = data.kpis.clientesNuevos;
    if (k.value === 0 || data.clientesNuevos.length === 0) {
      return `No hay clientes nuevos registrados en el período actual.`;
    }
    return `${k.value} cliente(s) nuevo(s) en el período:\n\n` +
      data.clientesNuevos.slice(0, 6).map((c, i) =>
        `${i + 1}. ${c.nombre} (${c.zona})\n   Primera compra: ${abbr(c.primeraCompra)} · ${c.fechaCreacion}`
      ).join('\n');
  }

  // ── Alertas ──
  if (has('alerta', 'atencion', 'critico', 'critica', 'urgente', 'problema')) {
    const total = data.alertas.length;
    if (total === 0) return `No hay alertas activas en el período. ¡Todo en orden!`;

    const criticas = data.alertas.filter(a => a.nivel === 'critica');
    const altas    = data.alertas.filter(a => a.nivel === 'alta');
    const medias   = data.alertas.filter(a => a.nivel === 'media');

    let resp = `Hay ${total} alerta(s) activa(s):`;
    if (criticas.length > 0) resp += `\n🔴 Críticas (${criticas.length}):\n${criticas.map(a => `   • ${a.titulo}`).join('\n')}`;
    if (altas.length > 0)    resp += `\n🟠 Altas (${altas.length}):\n${altas.map(a => `   • ${a.titulo}`).join('\n')}`;
    if (medias.length > 0)   resp += `\n🔵 Medias (${medias.length}):\n${medias.map(a => `   • ${a.titulo}`).join('\n')}`;
    return resp;
  }

  // ── Zonas / Consultores ──
  if (has('zona', 'zonas', 'region', 'equipo', 'consultor', 'consultores', 'territorio')) {
    if (data.ventasPorZona.length === 0) {
      return `No hay datos de ${view === 'consultor' ? 'consultores' : 'zonas'} disponibles para el filtro actual.`;
    }
    const sorted = [...data.ventasPorZona]
      .filter(z => z.presupuesto > 0)
      .sort((a, b) => b.cumplimiento - a.cumplimiento);
    const label = view === 'consultor' ? 'consultores' : 'zonas';
    return `${sorted.length} ${label} activos. Ranking por cumplimiento:\n\n` +
      sorted.slice(0, 8).map(z => {
        const icon = z.cumplimiento >= 100 ? '✓' : z.cumplimiento >= 80 ? '⚠' : '✗';
        const mrg  = view === 'gerencial' && z.margen > 0 ? ` | ${pct(z.margen)} mrg` : '';
        return `${icon} ${z.zona}: ${pct(z.cumplimiento)} cumpl. · ${abbr(z.venta)}${mrg}`;
      }).join('\n');
  }

  // ── Productos ──
  if (has('producto', 'productos', 'top producto', 'mejor producto')) {
    if (data.ventasPorProducto.length === 0) {
      return `No hay datos de productos disponibles para el filtro actual.`;
    }
    return `Top productos por venta:\n\n` +
      data.ventasPorProducto.slice(0, 6).map((p, i) => {
        const mrg = view === 'gerencial' && p.margen > 0 ? ` | ${pct(p.margen)} mrg` : '';
        return `${i + 1}. ${p.producto}: ${abbr(p.venta)} · ${pct(p.cumplimiento)} cumpl.${mrg} [Cat.${p.categoria}]`;
      }).join('\n');
  }

  // ── Clientes Pareto ──
  if (has('pareto', 'cliente top', 'mejores clientes', 'top cliente')) {
    if (data.clientesPareto.length === 0) {
      return `No hay datos de clientes disponibles para el filtro actual.`;
    }
    return `Top clientes (Pareto 80/20):\n\n` +
      data.clientesPareto.slice(0, 6).map((c, i) =>
        `${i + 1}. ${c.nombre} (${c.zona}): ${abbr(c.venta)} — ${pct(c.porcentaje)} del total`
      ).join('\n');
  }

  // ── Tendencia mensual ──
  if (has('tendencia', 'mensual', 'historico', 'evolucion', 'mes a mes', 'cada mes')) {
    if (data.ventasPorMes.length === 0) {
      return `Para ver la tendencia mensual, selecciona el filtro "Año completo" y el gráfico mostrará la evolución mes a mes.`;
    }
    return `Tendencia mensual de venta:\n\n` +
      data.ventasPorMes.map(m => {
        const icon = m.cumplimiento >= 100 ? '✓' : m.cumplimiento >= 80 ? '⚠' : '✗';
        return `${icon} ${m.zona}: ${abbr(m.venta)} (${pct(m.cumplimiento)} cumpl.)`;
      }).join('\n');
  }

  // ── Inventario ──
  if (has('inventario', 'stock', 'bodega', 'almacen')) {
    if (data.inventario.length === 0) {
      return `El módulo de inventario no tiene datos conectados aún.`;
    }
    const total = data.inventario.reduce((s, b) => s + b.stockPremix, 0);
    return `Stock total Premix: ${(total / 1000).toFixed(0)} toneladas en ${data.inventario.length} bodegas.`;
  }

  // ── Resumen ──
  if (has('resumen', 'como estamos', 'estado general', 'panorama', 'como va todo')) {
    const v = data.kpis.ventaMes;
    const m = data.kpis.margenBruto;
    const otif = data.kpis.otif;
    const change = v.previousValue > 0
      ? ((v.value - v.previousValue) / v.previousValue * 100) : null;

    let resp = `Resumen del período:\n\n`;
    resp += `📊 Venta: ${abbr(v.value)}`;
    if (change !== null) resp += ` (${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs ant.)`;
    resp += `\n📈 ${view === 'consultor' ? 'Cumplimiento' : 'Margen'}: ${pct(m.value)}\n`;
    resp += `🚚 OTIF: ${pct(otif.value)} (meta 95%)\n`;
    resp += `👥 Sin movimiento: ${data.kpis.clientesSinMovimiento.value}\n`;
    resp += `🆕 Clientes nuevos: ${data.kpis.clientesNuevos.value}\n`;
    if (data.alertas.length > 0) {
      const criticas = data.alertas.filter(a => a.nivel === 'critica').length;
      resp += `⚠ Alertas: ${data.alertas.length}${criticas > 0 ? ` (${criticas} crítica(s))` : ''}`;
    } else {
      resp += `✓ Sin alertas activas`;
    }
    return resp;
  }

  // ── Ayuda ──
  if (has('ayuda', 'que puedes', 'como funciona', 'que haces', 'que sabes', 'opciones')) {
    return `Puedo consultarte:\n\n• Ventas del mes y tendencia\n• ${view === 'gerencial' ? 'Margen bruto por zona' : 'Cumplimiento por consultor'}\n• Cumplimiento de presupuesto\n• OTIF\n• Clientes sin movimiento\n• Clientes nuevos\n• Alertas activas\n• Top productos\n• Clientes Pareto (80/20)\n\n¿Qué quieres saber?`;
  }

  // ── Fallback ──
  return `No encontré información específica para esa consulta. Prueba con: ventas, cumplimiento, OTIF, clientes sin movimiento, clientes nuevos, zonas, productos o alertas.`;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function AnimatedDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1 align-middle">
      <span className="w-1 h-1 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1 h-1 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1 h-1 bg-[#8B8B8D] rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

function buildChips(data: DashboardData, view: 'gerencial' | 'consultor'): string[] {
  const chips: string[] = ['¿Cómo van las ventas del mes?'];
  chips.push(
    view === 'gerencial'
      ? '¿Qué zona tiene el peor margen?'
      : '¿Cuál consultor tiene menor cumplimiento?',
  );
  if (data.kpis.clientesSinMovimiento.value > 0)
    chips.push('¿Cuáles clientes llevan más días sin comprar?');
  if (data.kpis.otif.value < 95)
    chips.push(`OTIF en ${data.kpis.otif.value.toFixed(1)}%, ¿qué está pasando?`);
  if (data.clientesNuevos.length > 0)
    chips.push('¿Quiénes son los clientes nuevos?');
  return chips.slice(0, 4);
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: '¡Hola! Soy el asistente comercial CTC. Puedo consultarte datos de ventas, margen, OTIF, clientes y más. ¿Qué quieres saber?',
  timestamp: new Date(),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatBot({ data, view = 'gerencial' }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isSending) return;

    setInput('');
    setIsSending(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    const placeholderId = (Date.now() + 1).toString();
    const placeholder: Message = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, placeholder]);

    if (!data) {
      setMessages(prev =>
        prev.map(m =>
          m.id === placeholderId
            ? { ...m, content: 'Los datos del dashboard aún no están disponibles. Por favor espera un momento.', isStreaming: false }
            : m,
        ),
      );
      setIsSending(false);
      return;
    }

    const response = generateResponse(content, data, view);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    await simulateStream(
      response,
      (chunk) =>
        setMessages(prev =>
          prev.map(m => m.id === placeholderId ? { ...m, content: m.content + chunk } : m)
        ),
      ctrl.signal,
    );

    if (!ctrl.signal.aborted) {
      setMessages(prev =>
        prev.map(m => m.id === placeholderId ? { ...m, isStreaming: false } : m)
      );
      setIsSending(false);
    }
  }, [input, isSending, data, view]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const chips     = data ? buildChips(data, view) : [];
  const showChips = messages.length === 1 && chips.length > 0;

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
        <div className="bg-white rounded-[12px] shadow-2xl border border-[#DBE2EB] flex flex-col
          w-[calc(100vw-2rem)] h-[calc(100svh-5rem)]
          sm:w-[380px] sm:h-[520px]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#993935] rounded-t-[12px] flex-shrink-0">
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
                <div className="flex flex-col max-w-[78%]">
                  <div className={`rounded-[10px] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#993935] text-white rounded-br-[3px]'
                      : 'bg-[#EFF2F6] text-[#2B2E35] rounded-bl-[3px]'
                  }`}>
                    {msg.content || (msg.isStreaming ? null : '…')}
                    {msg.isStreaming && <AnimatedDots />}
                  </div>
                  <span className={`text-[10px] text-[#8B8B8D] mt-0.5 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#DBE2EB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#6B7381]" />
                  </div>
                )}
              </div>
            ))}

            {showChips && (
              <div className="flex flex-wrap gap-2 mt-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="text-[11px] bg-white border border-[#DBE2EB] hover:border-[#993935]/40 hover:bg-[#993935]/5 text-[#2B2E35] px-2.5 py-1.5 rounded-[8px] transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#DBE2EB] flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre ventas, margen, clientes…"
                className="flex-1 text-sm text-[#2B2E35] placeholder-[#8B8B8D] bg-[#EFF2F6] border border-[#DBE2EB] rounded-[8px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
                disabled={isSending}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || !input.trim()}
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
