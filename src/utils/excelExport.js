/**
 * Exportación Excel — SheetJS (xlsx)
 * Genera archivo .xlsx con 3 hojas:
 *   1. "Datos CFDI"  — campos parseados con formato moneda
 *   2. "Conceptos"   — tabla de partidas con clave SAT, cantidad, importe
 *   3. "Documento NO VALIDO DEMO" — texto generado + banner rojo
 *
 * Nombre de archivo: CFDI_DEMO_{RFC}_{FECHA}.xlsx
 */

import { TIPO_MAP, ALL_DOC_TYPES } from "./constants";

/**
 * Carga SheetJS dinámicamente desde CDN.
 * @returns {Promise<boolean>} true si se cargó correctamente
 */
export function loadSheetJS() {
  return new Promise((resolve) => {
    if (window.XLSX) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

/**
 * Exporta los datos del CFDI, conceptos y documento generado a un archivo .xlsx
 *
 * @param {Object} cfdi — datos parseados del CFDI
 * @param {string} docType — ID del tipo de documento generado
 * @param {string} rubro — rubro de la empresa
 * @param {string} result — texto del documento generado por IA
 */
export function exportToExcel(cfdi, docType, rubro, result) {
  if (!window.XLSX || !cfdi || !result) return;

  const XL = window.XLSX;
  const wb = XL.utils.book_new();

  const docLabel = ALL_DOC_TYPES.find((d) => d.id === docType)?.label || docType;
  const tipoLabel = TIPO_MAP[cfdi.tipo] || cfdi.tipo;

  // ═══════════════════════════════════════
  // Hoja 1: Datos CFDI
  // ═══════════════════════════════════════
  const hoja1 = [
    ["⚠ DATOS DEL CFDI — DEMO NO VÁLIDO"],
    [],
    ["Campo", "Valor"],
    ["UUID / Folio Fiscal", cfdi.uuid || "N/D"],
    ["Versión CFDI", cfdi.version],
    ["Tipo de Comprobante", `${tipoLabel} (${cfdi.tipo})`],
    ["Fecha de Emisión", cfdi.fecha || "N/D"],
    ["Fecha de Timbrado", cfdi.fechaTimbrado || "N/D"],
    ["Serie / Folio", `${cfdi.serie || "-"} / ${cfdi.folio || "-"}`],
    ["Lugar de Expedición (CP)", cfdi.lugarExpedicion || "N/D"],
    ["Moneda", cfdi.moneda],
    ["Forma de Pago", cfdi.formaPago || "N/D"],
    ["Método de Pago", cfdi.metodoPago || "N/D"],
    [],
    ["═══ EMISOR ═══"],
    ["RFC Emisor", cfdi.emisor.rfc],
    ["Nombre / Razón Social Emisor", cfdi.emisor.nombre],
    ["Régimen Fiscal", cfdi.emisor.regimen || "N/D"],
    [],
    ["═══ RECEPTOR ═══"],
    ["RFC Receptor", cfdi.receptor.rfc],
    ["Nombre / Razón Social Receptor", cfdi.receptor.nombre],
    ["Uso CFDI", cfdi.receptor.usoCFDI || "N/D"],
    ["CP Domicilio Fiscal Receptor", cfdi.receptor.domicilioFiscal || "N/D"],
    [],
    ["═══ TOTALES ═══"],
    ["Subtotal", parseFloat(cfdi.subtotal) || 0],
    ["Total Impuestos Trasladados", parseFloat(cfdi.totalImpuestos) || 0],
    ["Total", parseFloat(cfdi.total) || 0],
    [],
    ["═══ DOCUMENTO GENERADO ═══"],
    ["Tipo de Documento", docLabel],
    ["Rubro Empresa", rubro],
    ["Estado", "⚠ DEMO — NO VÁLIDO — Solo para efectos de demostración"],
  ];

  const ws1 = XL.utils.aoa_to_sheet(hoja1);
  ws1["!cols"] = [{ wch: 36 }, { wch: 56 }];
  ws1["!views"] = [{ state: "frozen", ySplit: 3 }]; // Fila 3 congelada
  XL.utils.book_append_sheet(wb, ws1, "Datos CFDI");

  // ═══════════════════════════════════════
  // Hoja 2: Conceptos
  // ═══════════════════════════════════════
  const hoja2Header = [
    [], // Fila 1 vacía
    ["#", "Clave Prod/Serv", "Descripción", "Cantidad", "Clave Unidad", "Unidad", "Valor Unitario", "Importe"], // Fila 2 headers
  ];
  const hoja2Rows = cfdi.conceptos.map((c, i) => [
    i + 1,
    c.claveProdServ || "",
    c.descripcion || "",
    parseFloat(c.cantidad) || 0,
    c.claveUnidad || "",
    c.unidad || "",
    parseFloat(c.valorUnitario) || 0,
    parseFloat(c.importe) || 0,
  ]);
  
  // Fila de totales con fórmula Excel real
  const lastRowIdx = 2 + cfdi.conceptos.length; // 2 filas iniciales + conceptos
  const totalsRow = [
    "TOTAL", "", "", "", "", "", "", { t: "n", f: `SUM(H3:H${lastRowIdx})` }
  ];

  const ws2 = XL.utils.aoa_to_sheet([...hoja2Header, ...hoja2Rows, totalsRow]);
  ws2["!cols"] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 48 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
  ];
  ws2["!views"] = [{ state: "frozen", ySplit: 2 }]; // Fila 2 congelada
  XL.utils.book_append_sheet(wb, ws2, "Conceptos");

  // ═══════════════════════════════════════
  // Hoja 3: Documento NO VALIDO DEMO
  // ═══════════════════════════════════════
  const docLines = result.split("\n");
  const hoja3 = [
    ["⚠ DOCUMENTO DEMO — NO VÁLIDO — Solo para efectos de demostración"],
    ["Tipo:", docLabel],
    ["Rubro:", rubro],
    ["UUID CFDI:", cfdi.uuid || "N/D"],
    ["Generado:", new Date().toLocaleString("es-MX")],
    [],
    ...docLines.map((line) => [line]),
    [],
    ["⚠ Documento generado por IA — verificar datos y citas legales antes de uso procesal o fiscal."],
    ["Fuentes oficiales: sat.gob.mx · dof.gob.mx · cff.gob.mx · sjf.scjn.gob.mx"],
  ];
  const ws3 = XL.utils.aoa_to_sheet(hoja3);
  ws3["!cols"] = [{ wch: 110 }];
  XL.utils.book_append_sheet(wb, ws3, "Documento NO VALIDO DEMO");

  // Nombre de archivo: CFDI_DEMO_{RFC}_{FECHA}.xlsx
  const fecha = (cfdi.fecha || "").split("T")[0].replace(/-/g, "");
  const rfcEmisor = (cfdi.emisor.rfc || "RFC").replace(/[^A-Z0-9]/gi, "");
  XL.writeFile(wb, `CFDI_DEMO_${rfcEmisor}_${fecha}.xlsx`);
}
