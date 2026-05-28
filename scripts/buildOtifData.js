/**
 * buildOtifData.js — Procesa archivos OTIF por mes y genera data/otifData.json
 * Lee HITS/MISSES del Resumen y causales de Novedades
 * Ejecutar con: node scripts/buildOtifData.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data', 'otif');
const OUTPUT = path.join(__dirname, '..', 'data', 'otifData.json');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MES_KEY_MAP = {
  'Enero': 'enero', 'Febrero': 'febrero', 'Marzo': 'marzo', 'Abril': 'abril',
  'Mayo': 'mayo', 'Junio': 'junio', 'Julio': 'julio', 'Agosto': 'agosto',
  'Septiembre': 'septiembre', 'Octubre': 'octubre', 'Noviembre': 'noviembre', 'Diciembre': 'diciembre',
};

const CAUSALES_PRINCIPALES = [
  'ALISTAMIENTO', 'CALIDAD', 'CANCELADO', 'CARTERA', 'INVENTARIO', 'PRODUCCION', 'TRANSPORTE', 'BACKORDER'
];

function readOtifSheet(filePath, mesCapital) {
  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });

  const resumenSheetName = wb.SheetNames.find(name =>
    (name.toLowerCase().includes('resumen') || name.toLowerCase().includes('resumén')) &&
    name.includes(mesCapital)
  );

  if (resumenSheetName) {
    return XLSX.utils.sheet_to_json(wb.Sheets[resumenSheetName], { defval: '' });
  }

  return null;
}

function readResumenMetrics(filePath, mesCapital) {
  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });

  const resumenSheetName = wb.SheetNames.find(name => {
    const lower = name.toLowerCase();
    return (lower.includes('resumen') || lower.includes('resumén')) && name.includes(mesCapital);
  });

  if (!resumenSheetName) return null;

  const ws = wb.Sheets[resumenSheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const metrics = {};

  data.forEach(row => {
    const label1 = String(row['__EMPTY'] || '').trim();
    const label2 = String(row['__EMPTY_1'] || '').trim();

    if (label1 === 'NUMERO DE PEDIDOS') metrics.numeroPedidos = Number(row['__EMPTY_1']);
    if (label1 === 'HITS') metrics.hits = Number(row['__EMPTY_1']);
    if (label1 === 'MISSES') metrics.misses = Number(row['__EMPTY_1']);
    if (label1 === 'TOTAL LINEAS') metrics.totalLineas = Number(row['__EMPTY_1']);

    if (label2 === 'NUMERO DE PEDIDOS') metrics.numeroPedidos = Number(row['__EMPTY_2']);
    if (label2 === 'HITS') metrics.hits = Number(row['__EMPTY_2']);
    if (label2 === 'MISSES') metrics.misses = Number(row['__EMPTY_2']);
    if (label2 === 'TOTAL LINEAS') metrics.totalLineas = Number(row['__EMPTY_2']);
  });

  if (!metrics.totalLineas && metrics.numeroPedidos) {
    metrics.totalLineas = metrics.numeroPedidos;
  }

  if (!metrics.numeroPedidos) {
    let cantidadRowIdx = data.findIndex(row =>
      String(row['__EMPTY_1'] || '').toLowerCase() === 'cantidad'
    );

    if (cantidadRowIdx < 0) {
      cantidadRowIdx = data.findIndex(row =>
        String(row['__EMPTY'] || '').toLowerCase() === 'cantidad'
      );
    }

    if (cantidadRowIdx >= 0 && cantidadRowIdx + 3 < data.length) {
      const totalRow = data[cantidadRowIdx + 2];
      const hitsRow = data[cantidadRowIdx + 3];
      const missesRow = data[cantidadRowIdx + 4];

      let totalVal = Number(totalRow['__EMPTY_1'] || 0);
      let hitsVal = Number(hitsRow['__EMPTY_1'] || 0);
      let missesVal = Number(missesRow['__EMPTY_1'] || 0);

      if (hitsVal < 10 && hitsVal > 0 && hitsVal < 1) {
        totalVal = Number(totalRow['__EMPTY'] || 0);
        hitsVal = Number(hitsRow['__EMPTY'] || 0);
        missesVal = Number(missesRow['__EMPTY'] || 0);
      }

      if (totalVal > 0 && hitsVal >= 0 && missesVal >= 0) {
        metrics.numeroPedidos = totalVal;
        metrics.totalLineas = totalVal;
        metrics.hits = hitsVal;
        metrics.misses = missesVal;
      }
    }
  }

  return metrics.totalLineas && metrics.hits !== undefined ? metrics : null;
}

function isCausalPrincipal(text) {
  if (!text) return false;
  const upper = String(text).trim().toUpperCase();
  return CAUSALES_PRINCIPALES.some(causal => upper === causal || upper.includes(causal + ' '));
}

function buildOtifData() {
  const otifPorMes = {};
  const otifPercentages = {};
  const causalesGlobales = new Set();

  for (const mesCapital of MESES) {
    const fileName = `OTIF 2026 ${mesCapital}.xlsx`;
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⏭ ${fileName} no existe`);
      continue;
    }

    try {
      const metrics = readResumenMetrics(filePath, mesCapital);
      const mesKey = MES_KEY_MAP[mesCapital];

      if (metrics && metrics.totalLineas) {
        const otifPercent = (metrics.hits / metrics.totalLineas) * 100;
        otifPercentages[mesKey] = {
          numeroPedidos: metrics.numeroPedidos,
          hits: metrics.hits,
          misses: metrics.misses,
          otifPercent: Math.round(otifPercent * 10) / 10
        };
        console.log(`  ✓ ${mesCapital}: ${metrics.hits}/${metrics.totalLineas} OTIF = ${otifPercent.toFixed(2)}%`);
      }

      const rows = readOtifSheet(filePath, mesCapital);
      if (!rows || rows.length === 0) continue;

      const causales = {};

      let causalMissesIdx = -1;
      for (let i = 0; i < rows.length; i++) {
        const rowStr = Object.values(rows[i]).join('|').toUpperCase();
        if (rowStr.includes('CAUSAL MISSES')) {
          causalMissesIdx = i;
          break;
        }
      }

      if (causalMissesIdx >= 0) {
        for (let i = causalMissesIdx + 1; i < rows.length; i++) {
          const row = rows[i];

          let causalText = String(
            row['Informe de despachos'] ||
            row['__EMPTY'] ||
            row['__EMPTY_1'] ||
            ''
          ).trim();

          if (causalText.toLowerCase().includes('total')) {
            break;
          }

          if (!causalText || causalText.length < 3) {
            continue;
          }

          if (!isCausalPrincipal(causalText)) {
            continue;
          }

          const numeros = [];
          for (const val of Object.values(row)) {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              numeros.push(num);
            }
          }

          let cantidad = 0;
          let valor = 0;

          if (numeros.length >= 2) {
            if (numeros[0] < numeros[1] && numeros[1] > 100000) {
              cantidad = numeros[0];
              valor = numeros[1];
            } else if (numeros.length >= 2) {
              cantidad = Math.min(...numeros.slice(0, 2));
              valor = Math.max(...numeros.slice(0, 2));
            }
          }

          if (cantidad === 0 || valor === 0 || isNaN(cantidad) || isNaN(valor)) {
            continue;
          }

          if (valor < 100000) {
            continue;
          }

          causales[causalText] = { cantidad, valor };
          causalesGlobales.add(causalText);
        }
      }

      otifPorMes[mesKey] = causales;
    } catch (e) {
      console.error(`  ✗ Error leyendo ${fileName}:`, e.message);
    }
  }

  const output = {
    por_mes: otifPorMes,
    otifPercentages,
    causales_totales: [...causalesGlobales].sort(),
    resumen: {
      total_causales: causalesGlobales.size,
      meses_procesados: Object.keys(otifPorMes).length,
      ultima_actualizacion: new Date().toISOString(),
    },
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');

  const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Datos OTIF guardados en data/otifData.json (${sizeMB} MB)`);
  console.log(`   - Meses procesados: ${output.resumen.meses_procesados}`);
  console.log(`   - Causales únicos encontrados: ${output.resumen.total_causales}`);
}

console.log('🔄 Procesando archivos OTIF...\n');

if (!fs.existsSync(DATA_DIR)) {
  console.error(`✗ Carpeta no encontrada: ${DATA_DIR}`);
  process.exit(1);
}

buildOtifData();
