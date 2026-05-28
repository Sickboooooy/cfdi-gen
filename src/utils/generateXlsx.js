/**
 * generateXlsx.js — Generador de expediente Excel con estilos ricos
 *
 * Usa: xlsx-js-style (drop-in de SheetJS con soporte de estilos de celda)
 * Función principal: generateExpedienteXlsx(cfdi, docType?, rubro?, aiText?) → void (descarga directa)
 *
 * 3 hojas:
 *   "Datos CFDI"     — tabla campo/valor con todos los metadatos del folio
 *   "Conceptos"      — tabla de productos con fórmulas SUM para totales
 *   "Documento DEMO" — texto IA si existe, o resumen del expediente
 *
 * Estilos:
 *   Headers: fondo #1A3A5C, texto blanco, bold
 *   Filas alternas: blanco / #F4F6F7
 *   Totales: fondo #D5F5E3, texto #1D6A39
 *   Banner DEMO: fondo #C0392B, texto blanco (todas las hojas)
 *
 * Nombre: CFDI_DEMO_{RFC}_{FOLIO}_{FECHA}.xlsx (o sin DEMO_ si producción)
 */

import * as XLSXStyle from "xlsx-js-style";
import { isDemoMode, demoPrefix } from "./demoMode";
import { ALL_DOC_TYPES, TIPO_MAP } from "./constants";

// ─── Estilos base ────────────────────────────────────────────────────────────

const S = {
  banner: {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Arial" },
    fill: { fgColor: { rgb: "C0392B" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  },
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Arial" },
    fill: { fgColor: { rgb: "1A3A5C" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      bottom: { style: "medium", color: { rgb: "062241" } },
    },
  },
  sectionHeader: {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Arial" },
    fill: { fgColor: { rgb: "062241" } },
    alignment: { horizontal: "left", vertical: "center" },
  },
  labelEven: {
    font: { bold: true, sz: 10, name: "Arial", color: { rgb: "1A3A5C" } },
    fill: { fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "center" },
  },
  valueEven: {
    font: { sz: 10, name: "Arial" },
    fill: { fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  },
  labelOdd: {
    font: { bold: true, sz: 10, name: "Arial", color: { rgb: "1A3A5C" } },
    fill: { fgColor: { rgb: "F4F6F7" } },
    alignment: { horizontal: "left", vertical: "center" },
  },
  valueOdd: {
    font: { sz: 10, name: "Arial" },
    fill: { fgColor: { rgb: "F4F6F7" } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  },
  totalLabel: {
    font: { bold: true, sz: 11, name: "Arial", color: { rgb: "1D6A39" } },
    fill: { fgColor: { rgb: "D5F5E3" } },
    alignment: { horizontal: "right", vertical: "center" },
  },
  totalValue: {
    font: { bold: true, sz: 11, name: "Arial", color: { rgb: "1D6A39" } },
    fill: { fgColor: { rgb: "D5F5E3" } },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt: '"$"#,##0.00',
  },
  bodyText: {
    font: { sz: 10, name: "Arial" },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
  },
  currency: {
    font: { sz: 10, name: "Arial" },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt: '"$"#,##0.00',
  },
  number: {
    font: { sz: 10, name: "Arial" },
    alignment: { horizontal: "right", vertical: "center" },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Crea una celda con valor y estilo */
function cell(v, s) {
  const t = typeof v === "number" ? "n" : "s";
  return { v, t, s };
}

/** Aplica estilo a una celda existente in-place en el worksheet */
function styleCell(ws, addr, s) {
  if (!ws[addr]) ws[addr] = { v: "", t: "s" };
  ws[addr].s = s;
}

/** Construye un worksheet desde array de arrays y aplica estilos por celda */
function buildWs(data) {
  const ws = XLSXStyle.utils.aoa_to_sheet(
    data.map((row) => row.map((c) => (c && typeof c === "object" && "v" in c ? c.v : c)))
  );
  // Transferir estilos
  const range = XLSXStyle.utils.decode_range(ws["!ref"] || "A1");
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSXStyle.utils.encode_cell({ r, c });
      const cellDef = data[r]?.[c];
      if (cellDef && typeof cellDef === "object" && cellDef.s) {
        ws[addr] = { ...ws[addr], s: cellDef.s };
      }
    }
  }
  return ws;
}

// ─── HOJA 1: Datos CFDI ──────────────────────────────────────────────────────

function buildHojaDatosCFDI(cfdi, docType, rubro) {
  const isDemo = isDemoMode();
  const isExcel = cfdi._fromExcel === true;
  const docLabel = ALL_DOC_TYPES.find((d) => d.id === docType)?.label || docType || "—";
  const tipoLabel = TIPO_MAP[cfdi.tipo] || cfdi.tipo;
  const folioId = cfdi._folioControl || cfdi.folio || "—";

  const bannerText = isDemo
    ? "⚠ DOCUMENTO DEMO — NO VÁLIDO — Solo para verificación del conector"
    : "CFDI-GEN — Expediente de Materialidad Fiscal — Itosturre Legaltech";

  const dataRows = [
    // fila 0: banner
    [cell(bannerText, S.banner), cell("", S.banner)],
    // fila 1: headers
    [cell("Campo", S.header), cell("Valor", S.header)],
    // Sección folio
    [cell("═══ FOLIO DE CONTROL ═══", S.sectionHeader), cell("", S.sectionHeader)],
    [cell("Folio de Control", S.labelOdd), cell(folioId, S.valueOdd)],
    [cell("UUID / Folio Fiscal", S.labelEven), cell(cfdi.uuid || "N/D", S.valueEven)],
    [cell("Versión CFDI", S.labelOdd), cell(cfdi.version, S.valueOdd)],
    [cell("Tipo de Comprobante", S.labelEven), cell(`${tipoLabel} (${cfdi.tipo})`, S.valueEven)],
    [cell("Fecha de Solicitud", S.labelOdd), cell(cfdi._fechaSolicitud || cfdi.fecha || "N/D", S.valueOdd)],
    [cell("Fecha de Cotización", S.labelEven), cell(cfdi._fechaCotizacion || "N/D", S.valueEven)],
    [cell("Fecha de Aceptación", S.labelOdd), cell(cfdi._fechaAceptacion || "N/D", S.valueOdd)],
    [cell("Fecha de Recepción", S.labelEven), cell(cfdi._fechaRecepcion || cfdi.fechaTimbrado || "N/D", S.valueEven)],
    [cell("Moneda", S.labelOdd), cell(cfdi.moneda || "MXN", S.valueOdd)],
    [cell("Forma de Pago", S.labelEven), cell(cfdi.formaPago || "N/D", S.valueEven)],
    [cell("Método de Pago", S.labelOdd), cell(cfdi.metodoPago || "N/D", S.valueOdd)],
    // Sección emisor
    [cell("═══ EMISOR ═══", S.sectionHeader), cell("", S.sectionHeader)],
    [cell("RFC Emisor", S.labelOdd), cell(cfdi.emisor?.rfc || "N/D", S.valueOdd)],
    [cell("Razón Social Emisor", S.labelEven), cell(cfdi.emisor?.nombre || "N/D", S.valueEven)],
    [cell("Régimen Fiscal", S.labelOdd), cell(cfdi.emisor?.regimen || "N/D", S.valueOdd)],
    // Sección receptor
    [cell("═══ RECEPTOR ═══", S.sectionHeader), cell("", S.sectionHeader)],
    [cell("RFC Receptor", S.labelOdd), cell(cfdi.receptor?.rfc || "N/D", S.valueOdd)],
    [cell("Razón Social Receptor", S.labelEven), cell(cfdi.receptor?.nombre || "N/D", S.valueEven)],
    [cell("Uso CFDI", S.labelOdd), cell(cfdi.receptor?.usoCFDI || "N/D", S.valueOdd)],
    [cell("CP Domicilio Fiscal", S.labelEven), cell(cfdi.receptor?.domicilioFiscal || "N/D", S.valueEven)],
    // Sección totales
    [cell("═══ TOTALES ═══", S.sectionHeader), cell("", S.sectionHeader)],
    [cell("Subtotal", S.labelOdd), cell(parseFloat(cfdi.subtotal) || 0, { ...S.valueOdd, numFmt: '"$"#,##0.00' })],
    [cell("IVA", S.labelEven), cell(parseFloat(cfdi.totalImpuestos) || 0, { ...S.valueEven, numFmt: '"$"#,##0.00' })],
    [cell("TOTAL", S.totalLabel), cell(parseFloat(cfdi.total) || 0, S.totalValue)],
    [cell("Total con Letra", S.labelOdd), cell(cfdi._totalLetra || "N/D", S.valueOdd)],
    // Sección documento
    [cell("═══ DOCUMENTO ═══", S.sectionHeader), cell("", S.sectionHeader)],
    [cell("Tipo de Documento", S.labelOdd), cell(docLabel, S.valueOdd)],
    [cell("Rubro Empresa", S.labelEven), cell(rubro || "N/D", S.valueEven)],
    [cell("Fuente de datos", S.labelOdd), cell(isExcel ? "Excel de control" : "CFDI XML", S.valueOdd)],
    [cell("Estado", S.labelEven), cell(isDemo ? "⚠ DEMO — NO VÁLIDO" : "Producción", S.valueEven)],
    [cell("Generado", S.labelOdd), cell(new Date().toLocaleString("es-MX"), S.valueOdd)],
  ];

  const ws = buildWs(dataRows);
  ws["!cols"] = [{ wch: 38 }, { wch: 60 }];
  ws["!rows"] = [{ hpt: 28 }]; // fila 1 (banner) más alta
  ws["!views"] = [{ state: "frozen", ySplit: 3 }]; // Freeze fila 3 (después de banner + header)
  // Merge de banner y secciones (columna A+B)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Banner
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },  // Sección folio
    { s: { r: 13, c: 0 }, e: { r: 13, c: 1 } }, // Sección emisor
    { s: { r: 17, c: 0 }, e: { r: 17, c: 1 } }, // Sección receptor
    { s: { r: 22, c: 0 }, e: { r: 22, c: 1 } }, // Sección totales
    { s: { r: 27, c: 0 }, e: { r: 27, c: 1 } }, // Sección documento
  ];

  return ws;
}

// ─── HOJA 2: Conceptos ───────────────────────────────────────────────────────

function buildHojaConceptos(cfdi) {
  const isDemo = isDemoMode();
  const conceptos = cfdi._productosRaw || cfdi.conceptos || [];

  const bannerText = isDemo
    ? "⚠ DOCUMENTO DEMO — NO VÁLIDO — Solo para verificación del conector"
    : "CFDI-GEN — Conceptos del Expediente — Itosturre Legaltech";

  const headers = ["#", "Descripción / Concepto", "Unidad", "Cantidad", "Valor Unitario", "Importe"];
  const headerRow = headers.map((h) => cell(h, S.header));

  const dataRows = conceptos.map((c, i) => {
    const isOdd = i % 2 !== 0;
    const bgLabel = isOdd ? S.labelOdd : S.labelEven;
    const bgValue = isOdd ? S.valueOdd : S.valueEven;
    const desc = c.desc || c.descripcion || "";
    const unidad = c.unidad || "Servicio";
    const cant = typeof c.cantidad === "string" ? parseFloat(c.cantidad) : (c.cantidad ?? 0);
    const vu = typeof c.valorUnitario === "string" ? parseFloat(c.valorUnitario) : (c.valorUnitario ?? 0);
    const imp = typeof c.importe === "string" ? parseFloat(c.importe) : (c.importe ?? 0);

    return [
      cell(i + 1, bgLabel),
      cell(desc, bgValue),
      cell(unidad, bgValue),
      cell(cant, { ...bgValue, numFmt: "#,##0.00" }),
      cell(vu, { ...bgValue, numFmt: '"$"#,##0.00' }),
      cell(imp, { ...bgValue, numFmt: '"$"#,##0.00' }),
    ];
  });

  // Fila de totales con fórmula SUM
  const dataStart = 3; // fila 1=banner, 2=headers, 3..N=datos
  const dataEnd = dataStart + conceptos.length - 1;
  const totalsRow = [
    cell("", S.totalLabel),
    cell("", S.totalLabel),
    cell("", S.totalLabel),
    cell("", S.totalLabel),
    cell("TOTAL", S.totalLabel),
    {
      t: "n",
      f: `SUM(F${dataStart}:F${dataEnd})`,
      s: S.totalValue,
    },
  ];

  const allRows = [
    [cell(bannerText, S.banner), ...Array(5).fill(cell("", S.banner))],
    headerRow,
    ...dataRows,
    totalsRow,
  ];

  const ws = buildWs(allRows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 50 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];
  ws["!views"] = [{ state: "frozen", ySplit: 2 }]; // Freeze fila 2
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Banner ocupa toda la fila
  ];

  return ws;
}

// ─── HOJA 3: Documento DEMO ──────────────────────────────────────────────────

function buildHojaDocumento(cfdi, aiText) {
  const isDemo = isDemoMode();
  const folioId = cfdi._folioControl || cfdi.folio || "—";
  const sheetLabel = isDemo ? "Documento DEMO" : "Documento";

  const bannerText = isDemo
    ? "⚠ DOCUMENTO DEMO — NO VÁLIDO — Solo para verificación del conector"
    : "CFDI-GEN — Documento Generado — Itosturre Legaltech";

  const content = aiText
    ? aiText.split("\n").map((line) => [cell(line, S.bodyText)])
    : [
        [cell(`Expediente: ${folioId}`, S.bodyText)],
        [cell(`Emisor: ${cfdi.emisor?.nombre || "N/D"}`, S.bodyText)],
        [cell(`Receptor: ${cfdi.receptor?.nombre || "N/D"}`, S.bodyText)],
        [cell(`Total: ${cfdi.total || "N/D"}`, S.bodyText)],
        [cell("", S.bodyText)],
        [cell("Documento IA no disponible en este expediente.", { ...S.bodyText, font: { ...S.bodyText.font, italic: true, color: { rgb: "888888" } } })],
      ];

  const allRows = [
    [cell(bannerText, S.banner)],
    [cell(`Folio: ${folioId}`, S.labelEven)],
    [cell(`Generado: ${new Date().toLocaleString("es-MX")}`, S.labelOdd)],
    [cell("", S.bodyText)],
    ...content,
    [cell("", S.bodyText)],
    [cell("⚠ Documento generado por IA — verificar datos y citas legales antes de uso procesal o fiscal.", {
      font: { bold: true, sz: 10, name: "Arial", color: { rgb: "C0392B" } },
      alignment: { wrapText: true },
    })],
    [cell("Fuentes oficiales: sat.gob.mx · dof.gob.mx · cff.gob.mx · sjf.scjn.gob.mx", S.bodyText)],
  ];

  const ws = buildWs(allRows);
  ws["!cols"] = [{ wch: 110 }];

  return { ws, sheetLabel };
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Genera y descarga el archivo .xlsx con 3 hojas estilizadas.
 *
 * @param {Object} cfdi     — datos del CFDI o folio mapeado
 * @param {string} docType  — ID tipo de documento (opcional)
 * @param {string} rubro    — rubro de empresa (opcional)
 * @param {string} aiText   — texto generado por IA (opcional)
 */
export function generateExpedienteXlsx(cfdi, docType, rubro, aiText) {
  const XL = XLSXStyle;
  const wb = XL.utils.book_new();

  // Hoja 1: Datos CFDI
  const ws1 = buildHojaDatosCFDI(cfdi, docType, rubro);
  XL.utils.book_append_sheet(wb, ws1, "Datos CFDI");

  // Hoja 2: Conceptos
  const ws2 = buildHojaConceptos(cfdi);
  XL.utils.book_append_sheet(wb, ws2, "Conceptos");

  // Hoja 3: Documento DEMO
  const { ws: ws3, sheetLabel } = buildHojaDocumento(cfdi, aiText);
  XL.utils.book_append_sheet(wb, ws3, sheetLabel);

  // Nombre de archivo
  const demo = demoPrefix();
  const rfc = (cfdi.emisor?.rfc || "RFC").replace(/[^A-Z0-9]/gi, "");
  const folioId = (cfdi._folioControl || cfdi.folio || "SIN-FOLIO").replace(/[^A-Z0-9-_]/gi, "");
  const fecha = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const fileName = `${demo}CFDI_${rfc}_${folioId}_${fecha}.xlsx`;

  XL.writeFile(wb, fileName);
  return fileName;
}
