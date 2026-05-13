'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { mockData } from '@/lib/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hola! Soy el asistente comercial de CTC. Puedo ayudarte a consultar información sobre ventas, margen, OTIF, inventario y alertas. ¿Qué quieres saber?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('venta') || q.includes('vend')) {
      const total = mockData.kpis.ventaMes.value;
      return `La venta del mes actual es de $${(total / 1000000000).toFixed(1)}M, lo cual representa un incremento del 12.4% respecto al mes anterior.`;
    }
    
    if (q.includes('margen') || q.includes('rentabilidad')) {
      const margen = mockData.kpis.margenBruto.value;
      const zonaPeor = mockData.ventasPorZona.reduce((min, z) => z.margen < min.margen ? z : min);
      const productoPeor = mockData.ventasPorProducto.reduce((min, p) => p.margen < min.margen ? p : min);
      return `El margen bruto actual es del ${margen}%. La zona con menor margen es ${zonaPeor.zona} (${zonaPeor.margen}%) y el producto con menor margen es ${producto.producto} (${productoPeor.margen}%).`;
    }
    
    if (q.includes('otif') || q.includes('entrega') || q.includes('cumplimiento')) {
      const otif = mockData.kpis.otif.value;
      const peorZona = mockData.ventasPorZona.reduce((min, z) => z.margen < min.margen ? z : min);
      return `El OTIF actual es del ${otif}%. La zona ${peorZona.zona} requiere atención con ${peorZona.margen}% de cumplimiento vs presupuesto.`;
    }
    
    if (q.includes('inventario') || q.includes('stock') || q.includes('bodega')) {
      const total = mockData.inventario.reduce((sum, b) => sum + b.stockPremix, 0);
      const conProblemas = mockData.inventario.filter(b => b.estado !== 'alto').length;
      return `Stock total en todas las bodegas: ${(total / 1000).toFixed(0)} toneladas. Hay ${conProblemas} bodegas que requieren atención por nivel de inventario.`;
    }
    
    if (q.includes('cliente') && q.includes('nuev')) {
      return `Este mes se han registrado ${mockData.kpis.clientesNuevos.value} clientes nuevos. Los principales son: Fincas Modernas SAS (Medellín), Ganadería La Nueva Era (Norte de Antioquia) y Agroindustrias del Norte (Bogotá).`;
    }
    
    if (q.includes('cliente') && (q.includes('sin movimiento') || q.includes('inactivo') || q.includes('sin compra'))) {
      const clientes = mockData.clientesSinMovimiento;
      return `Hay ${clientes.length} clientes sin movimiento mayor a 30 días. Los más críticos son: Finca La Esperanza (45 días), Fincas del Valle (41 días) y Granja San José (38 días).`;
    }
    
    if (q.includes('queja') || q.includes('reclamo')) {
      return `Actualmente hay ${mockData.quejas.filter(q => q.estado === 'abierta').length} quejas abiertas. Las más recientes son: Entrega incompleta en Distribuidor Bogotá y Documentación en Agropecuaria Delta.`;
    }
    
    if (q.includes('nota crédito') || q.includes('notas')) {
      return `El valor de notas crédito del mes es de $${(mockData.kpis.notasCredito.value / 1000000).toFixed(0)}M. La mayor es de Ganadería Costa (Barranquilla) por $8.5M por producto defectuoso.`;
    }
    
    if (q.includes('zona') || q.includes('región')) {
      const mejorZona = mockData.ventasPorZona.reduce((max, z) => z.cumplimiento > max.cumplimiento ? z : max);
      const peorZona = mockData.ventasPorZona.reduce((min, z) => z.cumplimiento < min.cumplimiento ? z : min);
      return `La zona con mejor cumplimiento es ${mejorZona.zona} (${mejorZona.cumplimiento}%) y la que necesita más atención es ${peorZona.zona} (${peorZona.cumplimiento}%).`;
    }
    
    if (q.includes('producto') || q.includes('top') || q.includes('mejor')) {
      const top3 = mockData.ventasPorProducto.slice(0, 3);
      return `Los productos con mayor venta son: 1) ${top3[0].producto} (${(top3[0].venta/1000000000).toFixed(1)}M), 2) ${top3[1].producto} (${(top3[1].venta/1000000000).toFixed(1)}M), 3) ${top3[2].producto} (${(top3[2].venta/1000000000).toFixed(1)}M).`;
    }
    
    if (q.includes('alerta') || q.includes('atención') || q.includes('crítico')) {
      const criticas = mockData.alertas.filter(a => a.nivel === 'critica' || a.nivel === 'alta');
      return `Hay ${criticas.length} alertas que requieren atención: OTIF por debajo del 95% en Barranquilla, ${mockData.kpis.clientesSinMovimiento.value} clientes sin movimiento, ${mockData.kpis.alertasInventario.value} productos con inventario bajo.`;
    }
    
    return 'Puedes preguntarme sobre: ventas, margen, OTIF, inventario, clientes (nuevos/sin movimiento), quejas, notas crédito, zonas o productos. ¿Qué información necesitas?';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    setTimeout(() => {
      const response = generateResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#702b2b] hover:bg-[#1aa394] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Asistente CTC</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[380px] h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#702b2b] rounded-t-lg">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Asistente Comercial CTC</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-[#702b2b]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#1eb8a7]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#702b2b] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-[#702b2b]/10 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#1eb8a7]" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1eb8a7]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#702b2b] hover:bg-[#1aa394] disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Ejemplos: "¿Cuál es la venta del mes?", "¿Qué zonas tienen bajo margen?", "¿Cuántos clientes sin movimiento hay?"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const producto = { producto: '', venta: 0 };