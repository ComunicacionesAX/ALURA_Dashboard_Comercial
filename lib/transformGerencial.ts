import type { RawRow } from './sheetsClient';
import type {
  DashboardData, KPIMetric, VentaPorZona, VentaPorProducto,
  ClientePareto, ClienteSinMovimiento, ClienteNuevo, ResumenMensual,
  GerencialFilters, GerencialFilterOptions,
} from './types';

const MESES_ORD: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};
const MES_LABEL: Record<string, string> = {
  ene: 'Enero', feb: 'Febrero', mar: 'Marzo', abr: 'Abril',
  may: 'Mayo', jun: 'Junio', jul: 'Julio', ago: 'Agosto',
  sep: 'Septiembre', oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
};

type OrderedResumenMensual = ResumenMensual & { _ord: number };
type OrderedVentaPorZona = VentaPorZona & { _ord: number };

function n(v: unknown): number {
  const x = Number(v);
  return isNaN(x) ? 0 : x;
}

const money = (v: unknown) => n(v) * 1_000_000;

function kpi(label: string, value: number, prev: number, unit: KPIMetric['unit']): KPIMetric {
  return { label, value, previousValue: prev, unit };
}

function omitOrd<T extends { _ord: number }>(value: T): Omit<T, '_ord'> {
  const { _ord, ...rest } = value;
  void _ord;
  return rest;
}

function margenLetra(pct: number): 'A' | 'B' | 'C' | 'D' {
  if (pct >= 30) return 'A';
  if (pct >= 25) return 'B';
  if (pct >= 20) return 'C';
  return 'D';
}

// ── Build filter option lists from all ERP rows (unfiltered) ─────────────────
export function buildGerencialFilterOptions(rows: RawRow[], consultorFilter = ''): GerencialFilterOptions {
  const sociedades  = new Set<string>();
  const sbus        = new Set<string>();
  const divisiones  = new Set<string>();
  const periodos    = new Set<string>(); // "YYYY-mmm"
  const consultores = new Set<string>();
  const clientes    = new Set<string>();

  for (const r of rows) {
    if (r['Es_Ppto'] !== 'Es ERP') continue;
    const venta = money(r['Venta']);
    if (venta <= 0) continue;

    const soc  = String(r['Sociedad']  ?? '').trim();
    const sbu  = String(r['UEN']       ?? '').trim();
    const div  = String(r['Division']  ?? '').trim();
    const cons = String(r['Consultor_Cliente'] ?? '').trim();
    const cli  = String(r['Cliente']   ?? '').trim();
    const mes  = String(r['Mes']       ?? '').toLowerCase().trim();
    const year = n(r['Año']);

    if (soc  && soc  !== '-') sociedades.add(soc);
    if (sbu  && sbu  !== '-') sbus.add(sbu);
    if (div  && div  !== '-') divisiones.add(div);
    if (cons && cons !== '-' && cons !== 'ALIADOS') consultores.add(cons);
    if (year > 2000 && mes) periodos.add(`${year}-${mes}`);

    // Scope clientes to selected consultor
    if (consultorFilter && cons !== consultorFilter) continue;
    if (cli) clientes.add(cli);
  }

  // Sort periodos newest-first
  const sortedPeriodos = [...periodos].sort((a, b) => {
    const [ay, am] = a.split('-');
    const [by, bm] = b.split('-');
    const diff = Number(by) - Number(ay);
    return diff !== 0 ? diff : (MESES_ORD[bm] ?? 0) - (MESES_ORD[am] ?? 0);
  });

  return {
    sociedades:  [...sociedades].sort(),
    sbus:        [...sbus].sort(),
    divisiones:  [...divisiones].sort(),
    periodos:    sortedPeriodos,
    consultores: [...consultores].sort(),
    clientes:    [...clientes].sort(),
  };
}

// Decode "YYYY-mmm" back into year + mes key
function parsePeriodo(p: string): { year: number; mes: string } | null {
  const [y, m] = p.split('-');
  if (!y || !m) return null;
  return { year: Number(y), mes: m.toLowerCase() };
}

// ── Main transform ────────────────────────────────────────────────────────────
export function transformGerencial(
  rows: RawRow[],
  filters?: Partial<GerencialFilters>
): Partial<DashboardData> {
  const fSociedad  = filters?.sociedad  || '';
  const fSbu       = filters?.sbu       || '';
  const fDivision  = filters?.division  || '';
  const fPeriodo   = filters?.periodo   || '';
  const fConsultor = filters?.consultor || '';
  const fCliente   = filters?.cliente   || '';
  const hasFilter  = !!(fSociedad || fSbu || fDivision || fPeriodo || fConsultor || fCliente);

  // "YYYY-all" means full-year accumulation; regular "YYYY-mmm" means a single month
  const isAllYear     = fPeriodo.endsWith('-all');
  const allYear       = isAllYear ? Number(fPeriodo.split('-')[0]) : 0;
  const periodoFilter = (!isAllYear && fPeriodo) ? parsePeriodo(fPeriodo) : null;

  // ── Split rows ────────────────────────────────────────────────────────────
  const erp: RawRow[] = [];
  const pptoRows: RawRow[] = [];
  const yearSet = new Set<number>();

  for (const r of rows) {
    const y = n(r['Año']);
    if (r['Es_Ppto'] === 'Es ERP') {
      if (periodoFilter && y !== periodoFilter.year) continue;
      if (isAllYear     && y !== allYear)            continue;
      erp.push(r);
      if (y > 2000) yearSet.add(y);
    } else if (r['Es_Ppto'] === 'Es Ppto') {
      pptoRows.push(r);
    }
  }

  // Apply non-period filters to erp
  const erp2: RawRow[] = hasFilter ? erp.filter(r => {
    if (fSociedad  && String(r['Sociedad']          ?? '').trim() !== fSociedad)  return false;
    if (fSbu       && String(r['UEN']               ?? '').trim() !== fSbu)       return false;
    if (fDivision  && String(r['Division']          ?? '').trim() !== fDivision)  return false;
    if (fConsultor && String(r['Consultor_Cliente'] ?? '').trim() !== fConsultor) return false;
    if (fCliente   && String(r['Cliente']           ?? '').trim() !== fCliente)   return false;
    return true;
  }) : erp;

  const years = [...yearSet].sort((a, b) => b - a);
  const curYear = years[0] ?? new Date().getFullYear();

  // ── Pass 1: periods + monthly summary ────────────────────────────────────
  const periodSet = new Set<number>();
  const mesVentaMap = new Map<string, { ord: number; ventaTotal: number; ub: number }>();

  for (const r of erp2) {
    const year   = n(r['Año']);
    const venta  = money(r['Venta']);
    const ub     = money(r['UB']);
    const period = n(r['Periodo']);
    const mes    = String(r['Mes']).toLowerCase();

    if (year === curYear && venta > 0) periodSet.add(period);

    if (year === curYear) {
      const label = MES_LABEL[mes] ?? mes;
      if (!mesVentaMap.has(label)) mesVentaMap.set(label, { ord: MESES_ORD[mes] ?? 99, ventaTotal: 0, ub: 0 });
      const m = mesVentaMap.get(label)!;
      m.ventaTotal += venta;
      m.ub         += ub;
    }
  }

  // Monthly UB PPTO map (filled in pass 3 below)
  const mesUbPptoMap = new Map<string, number>();

  // When a periodo filter is active, treat that specific month as "current"
  let ultimoPeriodo: number;
  let penultimoPeriodo: number;

  if (isAllYear) {
    // Full-year: use the latest period serial as reference (for date display only)
    const periodosCur = [...periodSet].sort((a, b) => b - a);
    ultimoPeriodo    = periodosCur[0] ?? 0;
    penultimoPeriodo = 0;
  } else if (periodoFilter) {
    // Find the Excel serial that matches year+mes from the filtered rows
    const matchSerial = erp2.find(
      r => n(r['Año']) === periodoFilter.year &&
           String(r['Mes']).toLowerCase() === periodoFilter.mes &&
           money(r['Venta']) > 0
    );
    ultimoPeriodo    = matchSerial ? n(matchSerial['Periodo']) : 0;
    penultimoPeriodo = 0; // no prev-month comparison when a specific period is selected
  } else {
    const periodosCur = [...periodSet].sort((a, b) => b - a);
    ultimoPeriodo    = periodosCur[0] ?? 0;
    penultimoPeriodo = periodosCur[1] ?? 0;
  }

  const cutoff12m = ultimoPeriodo - 365;

  // ── Pass 2: cur/prev totals + zona/prod/pareto/client maps ────────────────
  let ventaCur = 0, ventaPrev = 0, ubCur = 0, ubPrev = 0;
  const clientesUltimoMes      = new Set<string>();
  const clientesUltimos12Meses = new Set<string>();
  const clientesMesAnterior    = new Map<string, { zona: string; venta: number }>();
  const zonaMap   = new Map<string, { venta: number; ppto: number; ub: number; clientes: Set<string> }>();
  const prodMap   = new Map<string, { venta: number; ppto: number; ub: number; material: string; segmento: string }>();
  const clienteVentaMap = new Map<string, { zona: string; venta: number }>();
  let mesCur = '';

  for (const r of erp2) {
    const period  = n(r['Periodo']);
    const venta   = money(r['Venta']);
    const ub      = money(r['UB']);
    const cliente = String(r['Cliente']);
    const mes     = String(r['Mes'] ?? '').toLowerCase();

    // When period filter is active, accumulate all rows (not just ultimoPeriodo)
    if (isAllYear) {
      if (n(r['Año']) !== allYear) continue;
      ventaCur += venta;
      ubCur    += ub;
      if (venta > 0) clientesUltimoMes.add(cliente);

      const zona = String(r['Equipo_Actual'] || '-');
      if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
      const z = zonaMap.get(zona)!;
      z.venta += venta; z.ub += ub; z.clientes.add(cliente);

      const prod = String(r['Producto Único'] || 'Otros');
      const seg  = String(r['Segmento_prod'] || '').trim();
      if (!prodMap.has(prod)) {
        prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || ''), segmento: seg });
      } else if (seg && !prodMap.get(prod)!.segmento) {
        prodMap.get(prod)!.segmento = seg;
      }
      const p = prodMap.get(prod)!;
      p.venta += venta; p.ub += ub;

      if (venta > 0) {
        if (!clienteVentaMap.has(cliente)) clienteVentaMap.set(cliente, { zona: String(r['Equipo_Actual'] || '-'), venta: 0 });
        clienteVentaMap.get(cliente)!.venta += venta;
      }
    } else if (periodoFilter) {
      if (n(r['Año']) !== periodoFilter.year || mes !== periodoFilter.mes) continue;
      ventaCur += venta;
      ubCur    += ub;
      if (venta > 0) clientesUltimoMes.add(cliente);
      if (!mesCur) mesCur = mes;

      const zona = String(r['Equipo_Actual'] || '-');
      if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
      const z = zonaMap.get(zona)!;
      z.venta += venta; z.ub += ub; z.clientes.add(cliente);

      const prod = String(r['Producto Único'] || 'Otros');
      const seg  = String(r['Segmento_prod'] || '').trim();
      if (!prodMap.has(prod)) {
        prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || ''), segmento: seg });
      } else if (seg && !prodMap.get(prod)!.segmento) {
        prodMap.get(prod)!.segmento = seg;
      }
      const p = prodMap.get(prod)!;
      p.venta += venta; p.ub += ub;

      if (venta > 0) {
        if (!clienteVentaMap.has(cliente)) clienteVentaMap.set(cliente, { zona: String(r['Equipo_Actual'] || '-'), venta: 0 });
        clienteVentaMap.get(cliente)!.venta += venta;
      }
    } else {
      if (period === ultimoPeriodo) {
        ventaCur += venta; ubCur += ub;
        if (venta > 0) clientesUltimoMes.add(cliente);
        if (!mesCur) mesCur = mes;

        const zona = String(r['Equipo_Actual'] || '-');
        if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
        const z = zonaMap.get(zona)!;
        z.venta += venta; z.ub += ub; z.clientes.add(cliente);

        const prod = String(r['Producto Único'] || 'Otros');
        const seg  = String(r['Segmento_prod'] || '').trim();
        if (!prodMap.has(prod)) {
          prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || ''), segmento: seg });
        } else if (seg && !prodMap.get(prod)!.segmento) {
          prodMap.get(prod)!.segmento = seg;
        }
        const p = prodMap.get(prod)!;
        p.venta += venta; p.ub += ub;

        if (venta > 0) {
          if (!clienteVentaMap.has(cliente)) clienteVentaMap.set(cliente, { zona: String(r['Equipo_Actual'] || '-'), venta: 0 });
          clienteVentaMap.get(cliente)!.venta += venta;
        }
      } else if (period === penultimoPeriodo) {
        ventaPrev += venta; ubPrev += ub;
        if (venta > 0) {
          if (!clientesMesAnterior.has(cliente)) clientesMesAnterior.set(cliente, { zona: String(r['Equipo_Actual'] || '-'), venta: 0 });
          clientesMesAnterior.get(cliente)!.venta += venta;
        }
      } else if (period > cutoff12m && period < ultimoPeriodo && venta > 0) {
        clientesUltimos12Meses.add(cliente);
      }
    }
  }

  const margenCur  = ventaCur  > 0 ? (ubCur  / ventaCur)  * 100 : 0;
  const margenPrev = ventaPrev > 0 ? (ubPrev / ventaPrev) * 100 : 0;

  // ── Pass 3: ppto rows → fill zona/prod ppto + monthly ppto + UB PPTO ──────
  const mesPptoMap = new Map<string, number>();
  let pptoCurTotal = 0;
  let ubPptoCur    = 0;

  for (const r of pptoRows) {
    const year   = n(r['Año']);
    const ppto   = money(r['Ppto']);
    const ubPpto = money(r['UB PPTO']);
    const mes    = String(r['Mes']).toLowerCase();

    // Apply same non-period filters to ppto rows
    if (fSociedad  && String(r['Sociedad']          ?? '').trim() !== fSociedad)  continue;
    if (fSbu       && String(r['UEN']               ?? '').trim() !== fSbu)       continue;
    if (fConsultor && String(r['Consultor_Cliente'] ?? '').trim() !== fConsultor) continue;
    if (fCliente   && String(r['Cliente']           ?? '').trim() !== fCliente)   continue;

    const yearMatches = isAllYear ? year === allYear : year === curYear;
    if (yearMatches) {
      const label = MES_LABEL[mes] ?? mes;
      mesPptoMap.set(label, (mesPptoMap.get(label) ?? 0) + ppto);
      mesUbPptoMap.set(label, (mesUbPptoMap.get(label) ?? 0) + ubPpto);

      // In full-year mode accumulate for all months; otherwise only current month
      if (isAllYear || mes === mesCur) {
        pptoCurTotal += ppto;
        ubPptoCur    += ubPpto;

        const zona = String(r['Equipo_Actual'] || '-');
        if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
        zonaMap.get(zona)!.ppto += ppto;

        const prod = String(r['Producto Único'] || 'Otros');
        if (!prodMap.has(prod)) prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || ''), segmento: '' });
        prodMap.get(prod)!.ppto += ppto;
      }
    }
  }

  // ── Clientes sin movimiento ───────────────────────────────────────────────
  const sinMovimientoList = [...clientesMesAnterior.keys()].filter(c => !clientesUltimoMes.has(c));
  const refDate  = ultimoPeriodo    > 0 ? new Date((ultimoPeriodo    - 25569) * 86400 * 1000) : new Date();
  const prevDate = penultimoPeriodo > 0 ? new Date((penultimoPeriodo - 25569) * 86400 * 1000) : new Date();

  const clientesSinMovimiento: ClienteSinMovimiento[] = sinMovimientoList
    .map((c, i) => {
      const dias = Math.max(0, Math.round((refDate.getTime() - prevDate.getTime()) / 86400000));
      return {
        id: String(i + 1),
        nombre: c,
        zona: clientesMesAnterior.get(c)!.zona,
        diasSinCompra: dias,
        ultimaCompra: prevDate.toISOString().slice(0, 10),
        potencial: Math.round(clientesMesAnterior.get(c)!.venta),
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // ── Clientes nuevos ───────────────────────────────────────────────────────
  const nuevos = [...clientesUltimoMes].filter(c => !clientesUltimos12Meses.has(c));

  const clientesNuevos: ClienteNuevo[] = nuevos.map((c, i) => ({
    id: String(i + 1),
    nombre: c,
    zona: clienteVentaMap.get(c)?.zona ?? '-',
    fechaCreacion: refDate.toISOString().slice(0, 10),
    primeraCompra: clienteVentaMap.get(c)?.venta ?? 0,
  })).sort((a, b) => b.primeraCompra - a.primeraCompra);

  // ── Output arrays ─────────────────────────────────────────────────────────
  const toCategoria = (s: string, fallback: 'A' | 'B' | 'C' | 'D'): 'A' | 'B' | 'C' | 'D' => {
    const v = s.trim().toUpperCase();
    if (v === 'A' || v === 'B' || v === 'C' || v === 'D') return v as 'A' | 'B' | 'C' | 'D';
    return fallback;
  };

  const ventasPorZona: VentaPorZona[] = [...zonaMap.entries()]
    .map(([zona, z]) => ({
      zona,
      venta: z.venta,
      presupuesto: z.ppto,
      cumplimiento: z.ppto > 0 ? (z.venta / z.ppto) * 100 : 0,
      margen: z.venta > 0 ? (z.ub / z.venta) * 100 : 0,
      clientsCount: z.clientes.size,
    }))
    .filter(z => z.venta > 0 || z.presupuesto > 0)
    .sort((a, b) => b.venta - a.venta);

  const ventasPorProducto: VentaPorProducto[] = [...prodMap.entries()]
    .map(([producto, p]) => {
      const margen = p.venta > 0 ? (p.ub / p.venta) * 100 : 0;
      return {
        producto,
        presentacion: p.material,
        venta: p.venta,
        presupuesto: p.ppto,
        cumplimiento: p.ppto > 0 ? (p.venta / p.ppto) * 100 : 0,
        margen,
        categoria: toCategoria(p.segmento, margenLetra(margen)),
      };
    })
    .filter(p => p.venta > 0 || p.presupuesto > 0)
    .sort((a, b) => b.venta - a.venta);

  const clientesPareto: ClientePareto[] = [...clienteVentaMap.entries()]
    .map(([nombre, c]) => ({
      nombre,
      zona: c.zona,
      venta: c.venta,
      porcentaje: ventaCur > 0 ? (c.venta / ventaCur) * 100 : 0,
      diasSinCompra: 0,
    }))
    .sort((a, b) => b.venta - a.venta)
    .slice(0, 20);

  const resumenMensual: ResumenMensual[] = [...new Set([...mesVentaMap.keys(), ...mesPptoMap.keys()])]
    .map(mes => {
      const v = mesVentaMap.get(mes) ?? { ord: 99, ventaTotal: 0, ub: 0 };
      return {
        mes,
        _ord: v.ord,
        ventaTotal: v.ventaTotal,
        ventaPresupuesto: mesPptoMap.get(mes) ?? 0,
        utilidadBruta: v.ub,
        utilidadBrutaPresupuesto: mesUbPptoMap.get(mes) ?? 0,
        margenBruto: v.ventaTotal > 0 ? (v.ub / v.ventaTotal) * 100 : 0,
        otif: 0, clientesNuevos: 0, clientesSinMovimiento: 0, quejas: 0, notasCredito: 0,
      } satisfies OrderedResumenMensual;
    })
    .sort((a, b) => a._ord - b._ord)
    .map(omitOrd);

  // ── ventasPorMes — for full-year chart (months as X-axis) ────────────────
  const ventasPorMes: VentaPorZona[] = [...new Set([...mesVentaMap.keys(), ...mesPptoMap.keys()])]
    .map(label => {
      const v   = mesVentaMap.get(label) ?? { ord: 99, ventaTotal: 0, ub: 0 };
      const ppto = mesPptoMap.get(label) ?? 0;
      const venta = v.ventaTotal;
      return {
        _ord: v.ord,
        zona: label,
        venta,
        presupuesto: ppto,
        cumplimiento: ppto > 0 ? (venta / ppto) * 100 : 0,
        margen: venta > 0 ? (v.ub / venta) * 100 : 0,
        clientsCount: 0,
      } satisfies OrderedVentaPorZona;
    })
    .sort((a, b) => a._ord - b._ord)
    .map(omitOrd);

  // ── Alerts — derived from same data as KPIs and chart ───────────────────
  const alertasFecha = refDate.toISOString().slice(0, 10);
  const alertas: DashboardData['alertas'] = [];
  let alertId = 0;

  for (const z of ventasPorZona) {
    if (z.presupuesto > 0 && z.cumplimiento < 80) {
      alertas.push({
        id: String(++alertId),
        tipo: 'otif',
        nivel: z.cumplimiento < 60 ? 'critica' : 'alta',
        titulo: `Zona bajo presupuesto: ${z.zona}`,
        descripcion: `Cumplimiento del ${z.cumplimiento.toFixed(1)}% vs presupuesto.`,
        zona: z.zona,
        fecha: alertasFecha,
      });
    }
  }

  if (sinMovimientoList.length > 0) {
    alertas.push({
      id: String(++alertId),
      tipo: 'cliente',
      nivel: sinMovimientoList.length >= 5 ? 'alta' : 'media',
      titulo: 'Clientes sin movimiento',
      descripcion: `${sinMovimientoList.length} cliente(s) sin compra en el período actual.`,
      fecha: alertasFecha,
    });
  }

  for (const p of ventasPorProducto.filter(p => p.categoria === 'D' && p.venta > 0).slice(0, 3)) {
    alertas.push({
      id: String(++alertId),
      tipo: 'margen',
      nivel: 'alta',
      titulo: `Margen bajo: ${p.producto}`,
      descripcion: `Margen del ${p.margen.toFixed(1)}%, por debajo del umbral mínimo (20%).`,
      fecha: alertasFecha,
    });
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis: DashboardData['kpis'] = {
    ventaMes:              kpi(isAllYear ? 'Venta año' : 'Venta del mes',             ventaCur,                 isAllYear ? pptoCurTotal : ventaPrev, 'currency'),
    utilidadBruta:         kpi(isAllYear ? 'Utilidad bruta año' : 'Utilidad bruta',   ubCur,                    ubPptoCur,       'currency'),
    margenBruto:           kpi('Margen bruto',                                         margenCur,                margenPrev,      'percentage'),
    otif:                  kpi('OTIF',                                                 82,                       80,              'percentage'),
    clientesSinMovimiento: kpi('Clientes sin movimiento (+30 días)',                   sinMovimientoList.length, 0,               'number'),
    clientesNuevos:        kpi('Clientes nuevos',                                      nuevos.length,            0,               'number'),
    quejas:                kpi('Quejas',                                               0,                        0,               'number'),
    notasCredito:          kpi('Notas crédito',                                        0,                        0,               'currency'),
    alertasInventario:     kpi('Alertas activas',                                      alertas.length,           0,               'number'),
  };

  return {
    kpis,
    ventasPorZona,
    ventasPorMes,
    ventasPorProducto,
    clientesPareto,
    clientesSinMovimiento,
    clientesNuevos,
    resumenMensual,
    quejas: [], notasCredito: [], alertas,
    gastosPorZona: [], inventario: [], inventarioPorProducto: [], reglasPromesa: [],
  };
}
