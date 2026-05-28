/**
 * parseExcelControl.js — Parser del Excel de control Crea → Goteborg
 *
 * Estructura del Excel (fila 1 = headers, datos desde fila 2):
 *   A  → FOLIO DE FACTURA
 *   B  → SOLICITUD (fecha)
 *   C  → COTIZACION (fecha)
 *   D  → ACEPTACION (fecha)
 *   E  → RECEPCION (fecha)
 *   F–K  → DESCRIPCION 1–6
 *   L–Q  → CANTIDAD 1–6
 *   R–W  → VALOR U 1–6
 *   X–AC → IMPORTE 1–6
 *   AD → SUBTOTAL
 *   AE → IVA
 *   AF → TOTAL
 *   AG → TOTAL LETRA
 *
 * Usa xlsx-js-style (instalado como dependencia npm).
 * Exporta: parseExcelControl(file: File) → Promise<Folio[]>
 */

import * as XLSXJS from "xlsx-js-style";

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
    } catch (_) {
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

/**
 * Índices de columna (0-based):
 *   A=0, B=1 ... F=5, G=6 ... L=11 ... R=17 ... X=23 ... AD=29, AE=30, AF=31, AG=32
 */
const COL = {
  FOLIO: 0,
  F_SOL: 1,
  F_COT: 2,
  F_ACE: 3,
  F_REC: 4,
  // Descripciones 1-6: columnas F(5) a K(10)
  DESC_START: 5,
  // Cantidades 1-6: columnas L(11) a Q(16)
  CANT_START: 11,
  // Valores unitarios 1-6: columnas R(17) a W(22)
  VALU_START: 17,
  // Importes 1-6: columnas X(23) a AC(28)
  IMP_START: 23,
  SUBTOTAL: 29,
  IVA: 30,
  TOTAL: 31,
  LETRA: 32,
};

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
 * }
 */
export async function parseExcelControl(file) {
  const arrayBuffer = await file.arrayBuffer();

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

  const folios = [];

  // Iterar desde fila 1 (índice 1, saltando fila 0 = headers)
  for (let r = 1; r <= maxRow; r++) {
    const folioVal = cellVal(ws, COL.FOLIO, r);

    // Ignorar filas con columna A vacía o null
    if (folioVal === null || folioVal === undefined || String(folioVal).trim() === "") {
      continue;
    }

    const folio = String(folioVal).trim();

    // Parsear productos (máximo 6 slots)
    const prods = [];
    for (let i = 0; i < 6; i++) {
      const desc = cellVal(ws, COL.DESC_START + i, r);
      // Omitir slots con descripción vacía
      if (!desc || String(desc).trim() === "") continue;

      const cantidad = cellVal(ws, COL.CANT_START + i, r);
      const valorUnitario = cellVal(ws, COL.VALU_START + i, r);
      const importe = cellVal(ws, COL.IMP_START + i, r);

      prods.push({
        desc: String(desc).trim(),
        cantidad: typeof cantidad === "number" ? cantidad : parseFloat(cantidad) || 0,
        valorUnitario: typeof valorUnitario === "number" ? valorUnitario : parseFloat(valorUnitario) || 0,
        importe: typeof importe === "number" ? importe : parseFloat(importe) || 0,
      });
    }

    const subtotalRaw = cellVal(ws, COL.SUBTOTAL, r);
    const ivaRaw = cellVal(ws, COL.IVA, r);
    const totalRaw = cellVal(ws, COL.TOTAL, r);
    const letraRaw = cellVal(ws, COL.LETRA, r);

    folios.push({
      folio,
      f_sol: fmtDate(cellVal(ws, COL.F_SOL, r)),
      f_cot: fmtDate(cellVal(ws, COL.F_COT, r)),
      f_ace: fmtDate(cellVal(ws, COL.F_ACE, r)),
      f_rec: fmtDate(cellVal(ws, COL.F_REC, r)),
      prods,
      subtotal: typeof subtotalRaw === "number" ? subtotalRaw : parseFloat(subtotalRaw) || 0,
      iva: typeof ivaRaw === "number" ? ivaRaw : parseFloat(ivaRaw) || 0,
      total: typeof totalRaw === "number" ? totalRaw : parseFloat(totalRaw) || 0,
      letra: letraRaw ? String(letraRaw).trim() : "",
    });
  }

  if (folios.length === 0) {
    throw new Error(
      "No se encontraron folios en el archivo. " +
      "Verifica que la columna A contenga los folios de factura " +
      "y que los datos comiencen en la fila 2."
    );
  }

  return folios;
}

/**
 * Convierte un Folio del Excel al objeto cfdi compatible con el sistema.
 * Mapeo aprobado con valores hardcodeados para Crea → Goteborg.
 *
 * @param {Object} folio — Folio parseado del Excel
 * @returns {Object} objeto cfdi-compatible
 */
export function folioToCfdi(folio) {
  return {
    // Identificación — placeholder claro en lugar de null
    uuid: "[UUID-CFDI-COMPLETAR-CON-XML-REAL]",
    version: "4.0",
    tipo: "I", // Ingreso por defecto
    fecha: folio.f_sol || new Date().toISOString(),
    fechaTimbrado: folio.f_rec || null,
    serie: "MANT",
    folio: folio.folio,
    moneda: "MXN",
    formaPago: "03", // Transferencia electrónica
    metodoPago: "PUE",
    lugarExpedicion: "44700",

    // Emisor hardcodeado — Infraestructura y Materiales Crea
    emisor: {
      rfc: "IMC240227MX5",
      nombre: "INFRAESTRUCTURA Y MATERIALES CREA, S.A. DE C.V.",
      regimen: "601",
    },

    // Receptor hardcodeado — Goteborg
    receptor: {
      rfc: "GOT211208L5A",
      nombre: "GOTEBORG, S.A. DE C.V.",
      usoCFDI: "G03",
      domicilioFiscal: "45645",
    },

    // Conceptos mapeados desde los productos del folio
    conceptos: folio.prods.map((p) => ({
      claveProdServ: "78101803",
      descripcion: p.desc,
      cantidad: String(p.cantidad),
      claveUnidad: "E48",
      unidad: "Servicio",
      valorUnitario: String(p.valorUnitario),
      importe: String(p.importe),
    })),

    // Totales
    subtotal: String(folio.subtotal),
    totalImpuestos: String(folio.iva),
    total: String(folio.total),

    // Datos adicionales del folio Excel
    _fromExcel: true,
    _folioControl: folio.folio,
    _fechaSolicitud: folio.f_sol,
    _fechaCotizacion: folio.f_cot,
    _fechaAceptacion: folio.f_ace,
    _fechaRecepcion: folio.f_rec,
    _totalLetra: folio.letra,
    _productosRaw: folio.prods,

    // Metadatos de empresa para el Word
    noCertSAT: null,
  };
}
