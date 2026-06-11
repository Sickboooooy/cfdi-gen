/**
 * parseExcelControl.js — Parser del Excel de control de folios (materialidad)
 *
 * Las columnas se detectan POR ENCABEZADO, no por posición fija, de modo que
 * el parser tolera variantes de acomodo mientras el equipo homologa las
 * plantillas. Encabezados reconocidos (sin acentos, mayúsculas/minúsculas y
 * espacios extra indistintos):
 *
 *   FOLIO DE FACTURA / FACTURA           → folio de control
 *   SOLICITUD / FECHA SOLICITUD          → fecha de solicitud
 *   COTIZACION / FECHA COTIZACION        → fecha de cotización
 *   ACEPTACION / FECHA ORDEN DE COMPRA   → fecha de aceptación
 *   RECEPCION / TARJETA DE RECEPCION     → fecha de recepción
 *   DESCRIPCION n / CONCEPTO n           → descripción del slot n
 *   CANTIDAD n | VALOR U n / VALOR UNITARIO n | IMPORTE n
 *     (slots de producto variables: 2 en CREA, 6 en MANTWENO, 8 en STEEL)
 *   SUBTOTAL | IVA | TOTAL | TOTAL LETRA / TOTAL EN LETRA
 *   PROVEEDOR                            → razón social del emisor por fila
 *
 * Cada folio incluye `advertencias[]` con inconsistencias detectadas en el
 * Excel (totales que no cuadran, fechas faltantes, folios duplicados, slots
 * incompletos). Los datos NUNCA se corrigen ni se inventan: se reportan tal
 * cual vienen y la advertencia lo hace notar al usuario.
 *
 * Si no se encuentra fila de encabezados se usa el layout legado de
 * posiciones fijas (A=folio, B–E=fechas, F–K=desc, L–Q=cant, R–W=v.u.,
 * X–AC=importe, AD–AG=totales).
 *
 * Usa xlsx-js-style (instalado como dependencia npm).
 * Exporta: parseExcelControl(file: File) → Promise<Folio[]>
 */

import * as XLSXJSNS from "xlsx-js-style";

// Interop CJS/ESM: en Vite los exports vienen en el namespace; en Node (tests) bajo .default
const XLSXJS = XLSXJSNS.read ? XLSXJSNS : XLSXJSNS.default;

/**
 * Formatea un valor de celda de Excel como fecha legible en es-MX.
 * Maneja tanto objetos Date como números seriales de Excel como strings.
 * @param {*} val — valor crudo de la celda
 * @returns {string} fecha formateada "DD/MM/YYYY" o string original
 */
function fmtDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return val.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  // Número serial de Excel → Date
  if (typeof val === "number" && val > 0) {
    try {
      const d = XLSXJS.SSF.parse_date_code(val);
      if (d) {
        const date = new Date(d.y, d.m - 1, d.d);
        return date.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }
  }
  // Ya es string
  return String(val);
}

/**
 * Obtiene el valor de una celda de forma segura.
 * @param {Object} ws — worksheet de SheetJS
 * @param {number} col — índice de columna (0-based)
 * @param {number} row — índice de fila (0-based)
 * @returns {*} valor de la celda o null
 */
function cellVal(ws, col, row) {
  const addr = XLSXJS.utils.encode_cell({ c: col, r: row });
  const cell = ws[addr];
  if (!cell) return null;
  // Para fechas, preferir objeto Date si está disponible
  if (cell.t === "d" && cell.v instanceof Date) return cell.v;
  return cell.v ?? null;
}

/** Convierte un valor de celda a número (0 si no es interpretable) */
function toNum(val) {
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

/**
 * Normaliza un encabezado para compararlo: sin acentos, mayúsculas,
 * espacios colapsados. "  Cotización " → "COTIZACION"
 */
function normHeader(val) {
  return String(val ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ColumnMap = {
 *   headerRow: number,        — fila de encabezados (los datos inician en la siguiente)
 *   folio, f_sol, f_cot, f_ace, f_rec: number|null,
 *   slots: [{ desc, cant, valu, imp }],  — índices de columna por slot de producto
 *   subtotal, iva, total, letra: number|null,
 * }
 */

/**
 * Busca la fila de encabezados en las primeras filas de la hoja y construye
 * el mapa de columnas. Retorna null si no hay encabezados reconocibles.
 * @param {Object} ws — worksheet de SheetJS
 * @param {Object} range — rango decodificado de la hoja
 * @returns {Object|null} ColumnMap
 */
function detectColumns(ws, range) {
  const lastHeaderScan = Math.min(range.e.r, 9);

  for (let r = range.s.r; r <= lastHeaderScan; r++) {
    const headers = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      headers[c] = normHeader(cellVal(ws, c, r));
    }
    if (!headers.some((h) => h && (h.includes("FOLIO") || h.includes("FACTURA")))) continue;

    const map = {
      headerRow: r,
      folio: null,
      f_sol: null,
      f_cot: null,
      f_ace: null,
      f_rec: null,
      slots: [],
      subtotal: null,
      iva: null,
      total: null,
      letra: null,
      proveedor: null,
    };

    // Slots de producto indexados por su número de encabezado ("DESCRIPCION 3" → 3)
    const slotMap = new Map();
    const slot = (n) => {
      const key = Number(n || 1);
      if (!slotMap.has(key)) slotMap.set(key, {});
      return slotMap.get(key);
    };

    headers.forEach((h, c) => {
      if (!h) return;
      let m;
      if (h.includes("LETRA")) map.letra = map.letra ?? c;
      else if (h.includes("FOLIO") || h.includes("FACTURA")) map.folio = map.folio ?? c;
      else if (h.includes("SOLICITUD")) map.f_sol = map.f_sol ?? c;
      else if (h.includes("COTIZACION")) map.f_cot = map.f_cot ?? c;
      else if (h.includes("ACEPTACION") || h.includes("ORDEN DE COMPRA")) map.f_ace = map.f_ace ?? c;
      else if (h.includes("RECEPCION")) map.f_rec = map.f_rec ?? c;
      else if (h.includes("PROVEEDOR")) map.proveedor = map.proveedor ?? c;
      else if ((m = h.match(/^(?:DESCRIPCION|CONCEPTO)\s*(\d*)$/))) slot(m[1]).desc = c;
      else if ((m = h.match(/^CANTIDAD\s*(\d*)$/))) slot(m[1]).cant = c;
      else if ((m = h.match(/^VALOR\s*U(?:NITARIO)?\.?\s*(\d*)$/))) slot(m[1]).valu = c;
      else if ((m = h.match(/^IMPORTE\s*(\d*)$/))) slot(m[1]).imp = c;
      else if (h === "SUBTOTAL") map.subtotal = c;
      else if (h === "IVA") map.iva = c;
      else if (h === "TOTAL") map.total = c;
    });

    map.slots = [...slotMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, cols]) => cols)
      .filter((s) => s.desc !== undefined);

    // Encabezados válidos: al menos folio y un slot de producto
    if (map.folio !== null && map.slots.length > 0) return map;
  }

  return null;
}

/**
 * Layout legado de posiciones fijas (plantilla original de 6 slots),
 * usado como fallback cuando la hoja no trae fila de encabezados.
 * A=0 folio, B–E=1–4 fechas, F–K=5–10 desc, L–Q=11–16 cant,
 * R–W=17–22 v.u., X–AC=23–28 importe, AD–AG=29–32 totales.
 */
function legacyColumns() {
  return {
    headerRow: 0,
    folio: 0,
    f_sol: 1,
    f_cot: 2,
    f_ace: 3,
    f_rec: 4,
    slots: Array.from({ length: 6 }, (_, i) => ({
      desc: 5 + i,
      cant: 11 + i,
      valu: 17 + i,
      imp: 23 + i,
    })),
    subtotal: 29,
    iva: 30,
    total: 31,
    letra: 32,
    proveedor: null,
  };
}

/**
 * Parsea un archivo .xlsx de control y retorna un array de Folios.
 * @param {File} file — archivo .xlsx seleccionado por el usuario
 * @returns {Promise<Folio[]>}
 *
 * Folio = {
 *   folio: string,
 *   f_sol: string,
 *   f_cot: string,
 *   f_ace: string,
 *   f_rec: string,
 *   prods: [{ desc, cantidad, valorUnitario, importe }],
 *   subtotal: number,
 *   iva: number,
 *   total: number,
 *   letra: string,
 *   proveedor: string,      — razón social del emisor según la fila (si el Excel la trae)
 *   advertencias: string[], — inconsistencias detectadas (no corregidas)
 * }
 */
const MAX_XLSX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 500;

export async function parseExcelControl(file) {
  const arrayBuffer = await file.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_XLSX_BYTES) {
    throw new Error("El archivo Excel supera el tamaño máximo permitido (5MB).");
  }

  const wb = XLSXJS.read(arrayBuffer, {
    type: "array",
    cellDates: true,    // Convierte seriales de fecha a objetos Date
    cellNF: true,       // Preserva formatos de número
    cellText: false,    // No forzar texto, queremos valores nativos
  });

  // Tomar la primera hoja
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    throw new Error("El archivo Excel no contiene hojas. Verifica que sea el Excel de control correcto.");
  }

  // Rango de la hoja
  const range = XLSXJS.utils.decode_range(ws["!ref"] || "A1");
  const maxRow = range.e.r; // última fila (0-based)

  // Detectar columnas por encabezado; si no hay, usar layout legado
  const cols = detectColumns(ws, range) || legacyColumns();

  const folios = [];

  // Iterar desde la fila siguiente a los encabezados; cap en MAX_ROWS
  const lastRow = Math.min(maxRow, cols.headerRow + MAX_ROWS);
  for (let r = cols.headerRow + 1; r <= lastRow; r++) {
    // Desahogar el Event Loop cada 50 filas para no congelar la UI
    if (r % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const folioVal = cellVal(ws, cols.folio, r);

    // Ignorar filas con folio vacío o null
    if (folioVal === null || folioVal === undefined || String(folioVal).trim() === "") {
      continue;
    }

    const folio = String(folioVal).trim();
    const advertencias = [];

    // Parsear productos según los slots detectados
    const prods = [];
    for (const s of cols.slots) {
      const desc = cellVal(ws, s.desc, r);
      // Omitir slots con descripción vacía
      if (!desc || String(desc).trim() === "") continue;

      const prod = {
        desc: String(desc).trim().replace(/\s+/g, " "),
        cantidad: s.cant !== undefined ? toNum(cellVal(ws, s.cant, r)) : 0,
        valorUnitario: s.valu !== undefined ? toNum(cellVal(ws, s.valu, r)) : 0,
        importe: s.imp !== undefined ? toNum(cellVal(ws, s.imp, r)) : 0,
      };
      if (!prod.cantidad || !prod.valorUnitario || !prod.importe) {
        advertencias.push(
          `Concepto "${prod.desc.slice(0, 50)}" incompleto en el Excel ` +
          `(cantidad: ${prod.cantidad || "—"}, v.u.: ${prod.valorUnitario || "—"}, importe: ${prod.importe || "—"}).`
        );
      }
      prods.push(prod);
    }

    // Totales: se toman tal cual del Excel, sin corregir ni calcular de más.
    // Única derivación aritmética permitida: si la plantilla NO trae columna
    // SUBTOTAL, se suma lo que sí viene (los importes) y se hace notar.
    const sumaImportes = prods.reduce((sum, p) => sum + p.importe, 0);
    let subtotal;
    if (cols.subtotal !== null) {
      subtotal = toNum(cellVal(ws, cols.subtotal, r));
      if (Math.abs(sumaImportes - subtotal) > 1) {
        advertencias.push(
          `La suma de importes ($${sumaImportes.toFixed(2)}) no coincide con el ` +
          `SUBTOTAL capturado en el Excel ($${subtotal.toFixed(2)}). Se respetó el valor del Excel.`
        );
      }
    } else {
      subtotal = sumaImportes;
      advertencias.push("El Excel no trae columna SUBTOTAL; se usó la suma de los importes.");
    }

    const iva = cols.iva !== null ? toNum(cellVal(ws, cols.iva, r)) : 0;
    if (cols.iva === null) {
      advertencias.push("El Excel no trae columna IVA; quedó en $0.00 (no se calculó para no inventar datos).");
    }

    const total = cols.total !== null ? toNum(cellVal(ws, cols.total, r)) : 0;
    if (cols.total === null) {
      advertencias.push("El Excel no trae columna TOTAL; quedó en $0.00 (no se calculó para no inventar datos).");
    } else if (Math.abs(subtotal + iva - total) > 1) {
      advertencias.push(
        `SUBTOTAL + IVA ($${(subtotal + iva).toFixed(2)}) no coincide con el TOTAL del ` +
        `Excel ($${total.toFixed(2)}). Se respetaron los valores del Excel.`
      );
    }

    const letraRaw = cols.letra !== null ? cellVal(ws, cols.letra, r) : null;

    const fechas = {
      f_sol: fmtDate(cellVal(ws, cols.f_sol, r)),
      f_cot: fmtDate(cellVal(ws, cols.f_cot, r)),
      f_ace: fmtDate(cellVal(ws, cols.f_ace, r)),
      f_rec: fmtDate(cellVal(ws, cols.f_rec, r)),
    };
    const etiquetasFecha = { f_sol: "solicitud", f_cot: "cotización", f_ace: "aceptación", f_rec: "recepción" };
    const fechasFaltantes = Object.keys(fechas).filter((k) => !fechas[k]).map((k) => etiquetasFecha[k]);
    if (fechasFaltantes.length > 0) {
      advertencias.push(`Sin fecha de ${fechasFaltantes.join(", ")} en el Excel.`);
    }

    const proveedorRaw = cols.proveedor !== null ? cellVal(ws, cols.proveedor, r) : null;

    folios.push({
      folio,
      ...fechas,
      prods,
      subtotal,
      iva,
      total,
      letra: letraRaw ? String(letraRaw).trim() : "",
      proveedor: proveedorRaw ? String(proveedorRaw).trim() : "",
      advertencias,
    });
  }

  // Folios duplicados en el Excel: se conservan ambos, pero se hace notar
  const conteo = new Map();
  for (const f of folios) conteo.set(f.folio, (conteo.get(f.folio) || 0) + 1);
  for (const f of folios) {
    if (conteo.get(f.folio) > 1) {
      f.advertencias.push(`El folio "${f.folio}" aparece ${conteo.get(f.folio)} veces en el Excel.`);
    }
  }

  if (folios.length === 0) {
    throw new Error(
      "No se encontraron folios en el archivo. " +
      "Verifica que exista una columna de encabezado 'FOLIO DE FACTURA' " +
      "y que los datos comiencen en la fila siguiente a los encabezados."
    );
  }

  return folios;
}

/**
 * Convierte un Folio del Excel al objeto cfdi compatible con el sistema.
 *
 * @param {Object} folio — Folio parseado del Excel
 * @param {Object} fiscal — Datos de emisor/receptor capturados en la UI
 * @returns {Object} objeto cfdi-compatible
 */
export function folioToCfdi(folio, fiscal = {}) {
  const {
    emisorRfc = "",
    emisorNombre = "",
    emisorRegimen = "",
    emisorCP = "",
    emisorDomicilio = "",
    receptorRfc = "",
    receptorNombre = "",
    receptorUsoCFDI = "",
    receptorCP = "",
    receptorDomicilio = "",
  } = fiscal;

  return {
    uuid: "[UUID-CFDI-COMPLETAR-CON-XML-REAL]",
    version: "4.0",
    tipo: "I",
    fecha: folio.f_sol || new Date().toISOString(),
    fechaTimbrado: folio.f_rec || null,
    serie: "",
    folio: folio.folio,
    moneda: "MXN",
    formaPago: "03",
    metodoPago: "PUE",
    lugarExpedicion: emisorCP || "N/D",

    emisor: {
      rfc: emisorRfc || "[RFC-EMISOR]",
      // Prioridad: captura de la UI > columna PROVEEDOR del Excel > placeholder
      nombre: emisorNombre || folio.proveedor || "[RAZÓN SOCIAL EMISOR]",
      regimen: emisorRegimen || "N/D",
    },

    receptor: {
      rfc: receptorRfc || "[RFC-RECEPTOR]",
      nombre: receptorNombre || "[RAZÓN SOCIAL RECEPTOR]",
      usoCFDI: receptorUsoCFDI || "N/D",
      domicilioFiscal: receptorCP || "N/D",
    },

    conceptos: folio.prods.map((p) => ({
      claveProdServ: "N/D",
      descripcion: p.desc,
      cantidad: String(p.cantidad),
      claveUnidad: "N/D",
      unidad: "Unidad",
      valorUnitario: String(p.valorUnitario),
      importe: String(p.importe),
    })),

    subtotal: String(folio.subtotal),
    totalImpuestos: String(folio.iva),
    total: String(folio.total),

    _fromExcel: true,
    _folioControl: folio.folio,
    _fechaSolicitud: folio.f_sol,
    _fechaCotizacion: folio.f_cot,
    _fechaAceptacion: folio.f_ace,
    _fechaRecepcion: folio.f_rec,
    _totalLetra: folio.letra,
    _productosRaw: folio.prods,
    _proveedorExcel: folio.proveedor || "",
    _advertencias: folio.advertencias || [],
    _emisorDomicilio: emisorDomicilio,
    _receptorDomicilio: receptorDomicilio,

    noCertSAT: null,
  };
}
