import { requireApiSession, getSessionFromRequest, getUserRole } from '@/lib/auth-core';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const session = await getSessionFromRequest(request);
  const view = session ? getUserRole(session.email) : 'consultor';

  try {
    const { question, context } = await request.json();

    if (!question?.trim()) {
      return Response.json({ error: 'Pregunta requerida.' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[api/chat] Checking ANTHROPIC_API_KEY:', apiKey ? `✓ presente (${apiKey.substring(0, 20)}...)` : '✗ no configurada');

    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY no configurada.' }, { status: 503 });
    }

    const systemPrompt = buildSystemPrompt(context, view);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          { role: 'user', content: question },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error('[api/chat] Claude error:', await res.text());
      return Response.json({ error: 'Error al consultar el asistente.' }, { status: 502 });
    }

    const json = await res.json();
    const answer = json.content?.[0]?.text ?? 'No pude generar una respuesta.';
    return Response.json({ answer });
  } catch (err) {
    console.error('[api/chat] error:', err);
    return Response.json({ error: 'Error interno.' }, { status: 500 });
  }
}

function buildSystemPrompt(context: Record<string, unknown> | null, view: string): string {
  if (!context) {
    return 'Eres un asistente comercial. No hay datos del dashboard disponibles en este momento.';
  }

  const kpis = context.kpis as Record<string, { value: number; previousValue?: number }> | undefined;
  const ventasPorZona   = context.ventasPorZona   as { zona: string; venta: number; cumplimiento: number; presupuesto: number; margen: number }[] | undefined;
  const alertas         = context.alertas         as { nivel: string; titulo: string }[] | undefined;
  const clientesSinMov  = context.clientesSinMovimiento as { nombre: string; zona: string; diasSinCompra: number }[] | undefined;
  const clientesNuevos  = context.clientesNuevos  as { nombre: string; zona: string }[] | undefined;
  const ventasPorProd   = context.ventasPorProducto as { producto: string; venta: number; margen: number; cumplimiento: number }[] | undefined;

  const fmt = (v: number) => `$${(v / 1_000_000).toFixed(0)}M`;
  const pct = (v: number) => `${v.toFixed(1)}%`;

  let prompt = `Eres un asistente comercial inteligente del Dashboard CTC de Alura. Respondes en español, de forma concisa y útil.
Vista: ${view === 'gerencial' ? 'Gerencial (acceso total)' : 'Consultor (vista comercial)'}

DATOS DEL DASHBOARD:
- Venta mes: ${kpis?.ventaMes ? fmt(kpis.ventaMes.value) : 'N/A'} (anterior: ${kpis?.ventaMes?.previousValue ? fmt(kpis.ventaMes.previousValue) : 'N/A'})
- ${view === 'gerencial' ? 'Margen bruto' : 'Cumplimiento'}: ${kpis?.margenBruto ? pct(kpis.margenBruto.value) : 'N/A'}
- OTIF: ${kpis?.otif ? pct(kpis.otif.value) : 'N/A'} (meta 95%)
- Clientes sin movimiento: ${kpis?.clientesSinMovimiento?.value ?? 'N/A'}
- Clientes nuevos: ${kpis?.clientesNuevos?.value ?? 'N/A'}`;

  if (ventasPorZona?.length) {
    const top = [...ventasPorZona].sort((a, b) => b.venta - a.venta).slice(0, 6);
    prompt += `\n\nTop ${view === 'consultor' ? 'consultores' : 'zonas'}:\n` +
      top.map(z => `- ${z.zona}: ${fmt(z.venta)}, ${pct(z.cumplimiento)} cumpl${view === 'gerencial' ? `, ${pct(z.margen)} margen` : ''}`).join('\n');
  }

  if (alertas?.length) {
    prompt += `\n\nAlertas (${alertas.length}):\n` +
      alertas.slice(0, 5).map(a => `- [${a.nivel}] ${a.titulo}`).join('\n');
  }

  if (clientesSinMov?.length) {
    prompt += `\n\nClientes sin movimiento:\n` +
      clientesSinMov.slice(0, 5).map(c => `- ${c.nombre} (${c.zona}): ${c.diasSinCompra} días`).join('\n');
  }

  if (clientesNuevos?.length) {
    prompt += `\n\nClientes nuevos: ${clientesNuevos.slice(0, 5).map(c => c.nombre).join(', ')}`;
  }

  if (ventasPorProd?.length) {
    prompt += `\n\nTop productos:\n` +
      ventasPorProd.slice(0, 5).map(p => `- ${p.producto}: ${fmt(p.venta)}${view === 'gerencial' ? `, ${pct(p.margen)} margen` : ''}`).join('\n');
  }

  prompt += '\n\nResponde en máximo 120 palabras. Si algo no está en los datos, dilo claramente.';
  return prompt;
}
