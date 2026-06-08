/**
 * generateDocx.js — Generador de expediente completo en formato Word (.docx)
 *
 * Usa: docx@^9.x (npm) — generación nativa docx en browser, sin html2canvas
 * Función principal: generateExpedienteDocx(cfdi, aiText?) → Blob
 *
 * Estructura del documento (5 secciones, separadas por PageBreak):
 *   1. PORTADA — tabla resumen con todos los datos del folio
 *   2. CARTA DE SOLICITUD DE SERVICIOS
 *   3. COTIZACIÓN — tabla de productos
 *   4. CARTA DE ACEPTACIÓN DE COTIZACIÓN
 *   5. CONSTANCIA DE ENTREGA-RECEPCIÓN + TARJETA DE RECEPCIÓN
 *
 * Validación pre-vuelo: llamar validateCfdiPartes(cfdis) antes de generateExpedienteDocx
 * para garantizar que RFC y nombre estén presentes en el CFDI.
 */

import { findFrontingByRfc } from "./avanzza/companiesDB";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  PageBreak,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  TextWrappingSide,
  Header,
  Footer,
} from "docx";

// ─── Helpers de imagen ───────────────────────────────────────────────────────

/** Cache en memoria: evita re-fetches del mismo logo/membretado en un batch */
const imageCache = new Map();

/** Aborta el fetch si supera este tiempo (evita que un logo lento congele la exportación) */
const IMAGE_FETCH_TIMEOUT_MS = 8000;

/** Intenta fetch de una URL relativa; retorna ArrayBuffer o null si no es imagen válida */
async function fetchImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      imageCache.set(url, null);
      return null;
    }
    // Rechazar respuestas HTML (SPA fallback de Vite/Vercel cuando el archivo no existe)
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      imageCache.set(url, null);
      return null;
    }
    const data = await res.arrayBuffer();
    imageCache.set(url, data);
    return data;
  } catch {
    imageCache.set(url, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Extensiones posibles de logos por companyId */
const LOGO_EXTS = ["png", "jpg", "jpeg"];

/** Retorna { data: ArrayBuffer, type: string } o null */
async function fetchLogo(companyId) {
  if (!companyId) return null;
  for (const ext of LOGO_EXTS) {
    const data = await fetchImage(`/avanzza/logos/${companyId}.${ext}`);
    if (data) return { data, type: ext === "jpeg" ? "jpg" : ext };
  }
  return null;
}

/** Retorna { data: ArrayBuffer, type: "png" } o null */
async function fetchMembretado(companyId) {
  if (!companyId) return null;
  const data = await fetchImage(`/avanzza/membretados/${companyId}.png`);
  return data ? { data, type: "png" } : null;
}

// ─── Validación pre-vuelo ────────────────────────────────────────────────────

/**
 * Verifica que cada CFDI tiene los datos mínimos para generar el Word.
 * Llamar ANTES de generateExpedienteDocx para mostrar el error al usuario.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCfdiPartes(cfdis) {
  const errors = [];
  const cfdiArray = Array.isArray(cfdis) ? cfdis : [cfdis];
  for (const [i, cfdi] of cfdiArray.entries()) {
    const folio = cfdi._folioControl || cfdi.folio || `#${i + 1}`;
    if (!cfdi.emisor?.rfc?.trim())    errors.push(`Folio ${folio}: RFC del emisor está vacío.`);
    if (!cfdi.emisor?.nombre?.trim()) errors.push(`Folio ${folio}: Nombre del emisor está vacío.`);
    if (!cfdi.receptor?.rfc?.trim())    errors.push(`Folio ${folio}: RFC del receptor está vacío.`);
    if (!cfdi.receptor?.nombre?.trim()) errors.push(`Folio ${folio}: Nombre del receptor está vacío.`);
  }
  return { valid: errors.length === 0, errors };
}

/** Construye el objeto de empresa a partir de los datos del CFDI (sin fallbacks hardcodeados) */
function resolvePartes(cfdi) {
  return {
    emisor: {
      nombre: (cfdi.emisor?.nombre || "").toUpperCase(),
      rfc: cfdi.emisor?.rfc || "",
      dir: cfdi._emisorDomicilio || "Sin domicilio registrado",
      firmante: "Representante Legal",
      cargo: "Representante Legal",
    },
    receptor: {
      nombre: (cfdi.receptor?.nombre || "").toUpperCase(),
      rfc: cfdi.receptor?.rfc || "",
      dir: cfdi._receptorDomicilio || "Sin domicilio registrado",
      firmante: "Representante Legal",
      cargo: "Representante Legal",
    },
  };
}

// ─── Helpers de formato ──────────────────────────────────────────────────────

const MXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function fmtMXN(val) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return MXN.format(isNaN(n) ? 0 : n);
}

// Paleta de colores
const COLORS = {
  NAVY: "062241",     // Azul oscuro Itosturre
  BLUE_MID: "1A3A5C",
  WHITE: "FFFFFF",
  GRAY_LIGHT: "F4F6F7",
  GREEN_LIGHT: "D5F5E3",
  GREEN_DARK: "1D6A39",
  RED: "C0392B",
  GRAY_TEXT: "888888",
  BLACK: "000000",
};

/** Crea un TextRun de Arial con opciones */
function tr(text, opts = {}) {
  return new TextRun({
    text: String(text ?? ""),
    font: "Arial",
    size: opts.size ?? 22,        // half-points: 22 = 11pt
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? COLORS.BLACK,
    break: opts.break ?? 0,
  });
}

/** Párrafo con TextRuns */
function p(runs, opts = {}) {
  const runArray = Array.isArray(runs) ? runs : [typeof runs === "string" ? tr(runs) : runs];
  return new Paragraph({
    children: runArray,
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.spaceBefore ?? 80, after: opts.spaceAfter ?? 80 },
    indent: opts.indent ?? undefined,
  });
}

/** Párrafo de título de sección — fondo sólido navy con texto blanco */
function sectionTitle(text) {
  return new Paragraph({
    children: [tr(text, { bold: true, size: 26, color: COLORS.WHITE })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    shading: { type: ShadingType.SOLID, color: COLORS.NAVY },
  });
}

/** Párrafo con salto de página */
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

/** Párrafo de logotipo — imagen real si está disponible, texto si no */
function logoParagraph(empresa, logoObj) {
  if (logoObj?.data) {
    return new Paragraph({
      children: [
        new ImageRun({
          data: logoObj.data,
          type: logoObj.type || "png",
          transformation: { width: 220, height: 72 },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
    });
  }
  return new Paragraph({
    children: [tr(`[ LOGOTIPO ${empresa} ]`, { color: COLORS.GRAY_TEXT, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
  });
}

/** Párrafo de línea de firma */
function signatureLine(label) {
  return new Paragraph({
    children: [tr(label, { bold: true })],
    spacing: { before: 400, after: 60 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
    },
  });
}

/** Celda de tabla simple */
function tc(children, opts = {}) {
  const cellChildren = Array.isArray(children) ? children : [typeof children === "string" ? p(children) : children];
  return new TableCell({
    children: cellChildren,
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading }
      : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    borders: opts.noBorder
      ? {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        }
      : undefined,
  });
}

/** Fila de tabla simple */
function trow(cells) {
  return new TableRow({ children: cells });
}

// ─── Header y Footer ─────────────────────────────────────────────────────────

function makeHeader(folio, emisorCorto, receptorCorto, membretadoData) {
  const label = emisorCorto && receptorCorto
    ? `${folio} · ${emisorCorto} → ${receptorCorto} · CFDI-GEN`
    : `${folio} · CFDI-GEN`;

  const children = [];

  // Si hay membretado, inyectarlo como fondo full-page
  if (membretadoData?.data) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: membretadoData.data,
            type: membretadoData.type || "png",
            transformation: { width: 816, height: 1056 }, // Letter a 96 dpi
            floating: {
              behindDocument: true,
              // zIndex debe ser unsigned int — no pasar valor negativo
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              wrap: {
                type: TextWrappingType.NONE,
                side: TextWrappingSide.BOTH_SIDES,
              },
            },
          }),
        ],
        spacing: { after: 0, before: 0 },
      })
    );
  }

  // Header de referencia (texto pequeño arriba a la derecha)
  children.push(
    new Paragraph({
      children: [
        tr(label, { size: 16, color: membretadoData ? "999999" : COLORS.GRAY_TEXT }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      border: membretadoData ? undefined : {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      },
    })
  );

  return new Header({ children });
}

function makeEmptyFooter() {
  return new Footer({ children: [] });
}

// ─── SECCIÓN 1: PORTADA ───────────────────────────────────────────────────────

function buildPortada(cfdi, partes, logos) {
  const { emisor: EMISOR, receptor: RECEPTOR } = partes;
  const { emisorLogo, receptorLogo } = logos || {};
  const isExcel = cfdi._fromExcel === true;
  const folioId = isExcel ? cfdi._folioControl : (cfdi.folio || cfdi.serie || "");

  const rows = [
    // Fila de logos (emisor izq | receptor der) — sin bordes visibles
    trow([
      tc([logoParagraph(EMISOR.nombre, emisorLogo)], { width: 50, noBorder: true }),
      tc([logoParagraph(RECEPTOR.nombre, receptorLogo)], { width: 50, noBorder: true }),
    ]),
    // Header de la tabla
    trow([
      tc(
        [p([tr("EXPEDIENTE DE MATERIALIDAD FISCAL", { bold: true, size: 24, color: COLORS.WHITE })], { align: AlignmentType.CENTER })],
        { shading: COLORS.NAVY, width: 100 }
      ),
    ]),
    trow([tc([p([tr("DATOS DEL FOLIO DE CONTROL", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.CENTER })], { shading: COLORS.BLUE_MID, width: 100 })]),
    // Datos del folio
    trow([
      tc([p([tr("Folio de Control:", { bold: true })])], { shading: COLORS.GRAY_LIGHT, width: 35 }),
      tc([p([tr(folioId)])], { width: 65 }),
    ]),
    trow([
      tc([p([tr("UUID / Folio Fiscal:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi.uuid || "[UUID-CFDI-COMPLETAR]")])]),
    ]),
    trow([
      tc([p([tr("Fecha de Solicitud:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi._fechaSolicitud || cfdi.fecha || "")])]),
    ]),
    trow([
      tc([p([tr("Fecha de Cotización:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi._fechaCotizacion || "")])]),
    ]),
    trow([
      tc([p([tr("Fecha de Aceptación:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi._fechaAceptacion || "")])]),
    ]),
    trow([
      tc([p([tr("Fecha de Recepción:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi._fechaRecepcion || cfdi.fechaTimbrado || "")])]),
    ]),
    // Emisor
    trow([tc([p([tr("EMISOR / PROVEEDOR", { bold: true, color: COLORS.WHITE })], { align: AlignmentType.CENTER })], { shading: COLORS.BLUE_MID, width: 100 })]),
    trow([
      tc([p([tr("Razón Social:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi.emisor?.nombre || EMISOR.nombre)])]),
    ]),
    trow([
      tc([p([tr("RFC:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi.emisor?.rfc || EMISOR.rfc)])]),
    ]),
    trow([
      tc([p([tr("Domicilio:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(EMISOR.dir)])]),
    ]),
    // Receptor
    trow([tc([p([tr("RECEPTOR / CLIENTE", { bold: true, color: COLORS.WHITE })], { align: AlignmentType.CENTER })], { shading: COLORS.BLUE_MID, width: 100 })]),
    trow([
      tc([p([tr("Razón Social:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi.receptor?.nombre || RECEPTOR.nombre)])]),
    ]),
    trow([
      tc([p([tr("RFC:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi.receptor?.rfc || RECEPTOR.rfc)])]),
    ]),
    trow([
      tc([p([tr("Domicilio:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(RECEPTOR.dir)])]),
    ]),
    // Totales
    trow([tc([p([tr("IMPORTES", { bold: true, color: COLORS.WHITE })], { align: AlignmentType.CENTER })], { shading: COLORS.BLUE_MID, width: 100 })]),
    trow([
      tc([p([tr("Subtotal:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(fmtMXN(cfdi.subtotal))])]),
    ]),
    trow([
      tc([p([tr("IVA (16%):", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(fmtMXN(cfdi.totalImpuestos || cfdi._iva))])]),
    ]),
    trow([
      tc([p([tr("TOTAL:", { bold: true })])], { shading: COLORS.GREEN_LIGHT }),
      tc([p([tr(fmtMXN(cfdi.total), { bold: true, color: COLORS.GREEN_DARK })])], { shading: COLORS.GREEN_LIGHT }),
    ]),
    trow([
      tc([p([tr("Total con letra:", { bold: true })])], { shading: COLORS.GRAY_LIGHT }),
      tc([p([tr(cfdi._totalLetra || "")])]),
    ]),
  ];

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
    p([]),
    p([tr("Guadalajara, Jalisco, a " + new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }), { color: COLORS.GRAY_TEXT })], { align: AlignmentType.CENTER }),
  ];
}

// ─── SECCIÓN 2: CARTA DE SOLICITUD ───────────────────────────────────────────

function buildCartaSolicitud(cfdi, partes, logos) {
  const { emisor: EMISOR, receptor: RECEPTOR } = partes;
  const { emisorLogo, receptorLogo } = logos || {};
  const folioId = cfdi._folioControl || cfdi.folio || "";
  const fechaSol = cfdi._fechaSolicitud || cfdi.fecha || "";
  const receptor = cfdi.receptor?.nombre || RECEPTOR.nombre;
  const rfcReceptor = cfdi.receptor?.rfc || RECEPTOR.rfc;

  return [
    sectionTitle("CARTA DE SOLICITUD DE SERVICIOS"),
    p([]),
    logoParagraph(RECEPTOR.nombre, receptorLogo),
    p([]),
    p([tr(`Guadalajara, Jalisco, a ${fechaSol}`)]),
    p([]),
    p([tr("C. REPRESENTANTE LEGAL", { bold: true })]),
    p([tr(EMISOR.nombre, { bold: true })]),
    p([tr(`RFC: ${EMISOR.rfc}`)]),
    p([tr(EMISOR.dir)]),
    p([tr("PRESENTE", { bold: true })]),
    p([]),
    p([
      tr("Por medio de la presente, ", {}),
      tr(`${receptor}`, { bold: true }),
      tr(`, con RFC `, {}),
      tr(rfcReceptor, { bold: true }),
      tr(`, con domicilio en ${RECEPTOR.dir}, solicita formalmente a usted la prestación de los servicios o suministro de bienes que a continuación se detallan, correspondientes al Folio de Control `),
      tr(folioId, { bold: true }),
      tr(":"),
    ]),
    p([]),
    // Tabla de conceptos/servicios solicitados
    ...(() => {
      const prods = cfdi._productosRaw || cfdi.conceptos || [];
      if (prods.length === 0) return [];
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          trow([
            tc([p([tr("#", { bold: true, color: COLORS.WHITE, size: 20 })])], { shading: COLORS.NAVY, width: 6 }),
            tc([p([tr("Concepto / Descripción", { bold: true, color: COLORS.WHITE, size: 20 })])], { shading: COLORS.NAVY, width: 54 }),
            tc([p([tr("Cant.", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.RIGHT })], { shading: COLORS.NAVY, width: 12 }),
            tc([p([tr("Importe", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.RIGHT })], { shading: COLORS.NAVY, width: 28 }),
          ]),
          ...prods.map((prod, i) => {
            const desc = prod.desc || prod.descripcion || "";
            const cant = prod.cantidad ?? "";
            const importe = prod.importe ?? prod.valorUnitario ?? "";
            const shade = i % 2 === 0 ? undefined : COLORS.GRAY_LIGHT;
            return trow([
              tc([p([tr(String(i + 1))])], { shading: shade, width: 6 }),
              tc([p([tr(desc)])], { shading: shade, width: 54 }),
              tc([p([tr(String(cant))], { align: AlignmentType.RIGHT })], { shading: shade, width: 12 }),
              tc([p([tr(fmtMXN(importe))], { align: AlignmentType.RIGHT })], { shading: shade, width: 28 }),
            ]);
          }),
        ],
      })];
    })(),
    p([]),
    p([
      tr("Los servicios antes descritos deberán prestarse de conformidad con los términos y condiciones establecidos en la cotización correspondiente, en cumplimiento con lo dispuesto por los Artículos "),
      tr("29 y 29-A del Código Fiscal de la Federación", { bold: true }),
      tr(" respecto de la debida documentación de las operaciones comerciales."),
    ]),
    p([]),
    p([tr("Sin más por el momento, quedo en espera de su confirmación.")]),
    p([]),
    p([]),
    // Firma receptor
    signatureLine(`${RECEPTOR.firmante} | ${RECEPTOR.cargo}`),
    p([tr(RECEPTOR.nombre)]),
    p([tr(`RFC: ${RECEPTOR.rfc}`)]),
    p([]),
  ];
}

// ─── SECCIÓN 3: COTIZACIÓN ────────────────────────────────────────────────────

function buildCotizacion(cfdi, partes, logos) {
  const { emisor: EMISOR, receptor: RECEPTOR } = partes;
  const { emisorLogo } = logos || {};
  const folioId = cfdi._folioControl || cfdi.folio || "";
  const fechaCot = cfdi._fechaCotizacion || cfdi.fecha || "";
  const prods = cfdi._productosRaw || cfdi.conceptos || [];

  // Cabecera de tabla de productos
  const headerRow = trow([
    tc([p([tr("#", { bold: true, color: COLORS.WHITE, size: 20 })])], { shading: COLORS.NAVY, width: 5 }),
    tc([p([tr("Descripción / Concepto", { bold: true, color: COLORS.WHITE, size: 20 })])], { shading: COLORS.NAVY, width: 43 }),
    tc([p([tr("Unidad", { bold: true, color: COLORS.WHITE, size: 20 })])], { shading: COLORS.NAVY, width: 10 }),
    tc([p([tr("Cantidad", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.RIGHT })], { shading: COLORS.NAVY, width: 9 }),
    tc([p([tr("Valor Unitario", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.RIGHT })], { shading: COLORS.NAVY, width: 16 }),
    tc([p([tr("Importe", { bold: true, color: COLORS.WHITE, size: 20 })], { align: AlignmentType.RIGHT })], { shading: COLORS.NAVY, width: 17 }),
  ]);

  const prodRows = prods.map((prod, i) => {
    const desc = prod.desc || prod.descripcion || "";
    const unidad = prod.unidad || "Servicio";
    const cant = prod.cantidad ?? "";
    const vu = prod.valorUnitario ?? "";
    const imp = prod.importe ?? "";
    const shade = i % 2 === 0 ? undefined : COLORS.GRAY_LIGHT;

    return trow([
      tc([p([tr(String(i + 1))])], { shading: shade, width: 5 }),
      tc([p([tr(desc)])], { shading: shade, width: 43 }),
      tc([p([tr(unidad)])], { shading: shade, width: 10 }),
      tc([p([tr(String(cant))], { align: AlignmentType.RIGHT })], { shading: shade, width: 9 }),
      tc([p([tr(fmtMXN(vu))], { align: AlignmentType.RIGHT })], { shading: shade, width: 16 }),
      tc([p([tr(fmtMXN(imp))], { align: AlignmentType.RIGHT })], { shading: shade, width: 17 }),
    ]);
  });

  // Filas de totales
  const subtotal = cfdi.subtotal || cfdi._subtotal || 0;
  const iva = cfdi.totalImpuestos || cfdi._iva || 0;
  const total = cfdi.total || cfdi._total || 0;

  const totalsRows = [
    trow([
      tc([p([])], { width: 5 }),
      tc([p([])], { width: 43 }),
      tc([p([])], { width: 10 }),
      tc([p([])], { width: 9 }),
      tc([p([tr("Subtotal:", { bold: true })], { align: AlignmentType.RIGHT })], { width: 16 }),
      tc([p([tr(fmtMXN(subtotal))], { align: AlignmentType.RIGHT })], { width: 17 }),
    ]),
    trow([
      tc([p([])], { width: 5 }),
      tc([p([])], { width: 43 }),
      tc([p([])], { width: 10 }),
      tc([p([])], { width: 9 }),
      tc([p([tr("IVA (16%):", { bold: true })], { align: AlignmentType.RIGHT })], { width: 16 }),
      tc([p([tr(fmtMXN(iva))], { align: AlignmentType.RIGHT })], { width: 17 }),
    ]),
    trow([
      tc([p([])], { shading: COLORS.GREEN_LIGHT, width: 5 }),
      tc([p([])], { shading: COLORS.GREEN_LIGHT, width: 43 }),
      tc([p([])], { shading: COLORS.GREEN_LIGHT, width: 10 }),
      tc([p([])], { shading: COLORS.GREEN_LIGHT, width: 9 }),
      tc([p([tr("TOTAL:", { bold: true, color: COLORS.GREEN_DARK })], { align: AlignmentType.RIGHT })], { shading: COLORS.GREEN_LIGHT, width: 16 }),
      tc([p([tr(fmtMXN(total), { bold: true, color: COLORS.GREEN_DARK })], { align: AlignmentType.RIGHT })], { shading: COLORS.GREEN_LIGHT, width: 17 }),
    ]),
  ];

  return [
    sectionTitle("COTIZACIÓN"),
    p([]),
    logoParagraph(EMISOR.nombre, emisorLogo),
    p([]),
    p([tr(`Guadalajara, Jalisco, a ${fechaCot}`)]),
    p([]),
    p([tr("ESTIMADO CLIENTE:", { bold: true })]),
    p([tr(RECEPTOR.nombre, { bold: true })]),
    p([]),
    p([
      tr("En respuesta a su solicitud de servicios, "),
      tr(EMISOR.nombre, { bold: true }),
      tr(` presenta la siguiente cotización correspondiente al Folio `),
      tr(folioId, { bold: true }),
      tr(":"),
    ]),
    p([]),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...prodRows, ...totalsRows],
    }),
    p([]),
    p([tr("Esta cotización tiene una vigencia de 15 días naturales a partir de su fecha de emisión.")]),
    p([]),
    p([]),
    signatureLine(`${EMISOR.firmante} | ${EMISOR.cargo}`),
    p([tr(EMISOR.nombre)]),
    p([tr(`RFC: ${EMISOR.rfc}`)]),
  ];
}

// ─── SECCIÓN 4: CARTA DE ACEPTACIÓN ──────────────────────────────────────────

function buildCartaAceptacion(cfdi, partes, logos) {
  const { emisor: EMISOR, receptor: RECEPTOR } = partes;
  const { receptorLogo } = logos || {};
  const folioId = cfdi._folioControl || cfdi.folio || "";
  const fechaAce = cfdi._fechaAceptacion || "";

  return [
    sectionTitle("CARTA DE ACEPTACIÓN DE COTIZACIÓN"),
    p([]),
    logoParagraph(RECEPTOR.nombre, receptorLogo),
    p([]),
    p([tr(`Guadalajara, Jalisco, a ${fechaAce}`)]),
    p([]),
    p([tr("C. REPRESENTANTE LEGAL", { bold: true })]),
    p([tr(EMISOR.nombre, { bold: true })]),
    p([tr(`RFC: ${EMISOR.rfc}`)]),
    p([tr("PRESENTE", { bold: true })]),
    p([]),
    p([
      tr("Por medio de la presente, "),
      tr(RECEPTOR.nombre, { bold: true }),
      tr(`, con RFC `),
      tr(RECEPTOR.rfc, { bold: true }),
      tr(`, manifiesta su formal `, {}),
      tr("ACEPTACIÓN", { bold: true }),
      tr(` de la cotización de servicios identificada con el Folio de Control `),
      tr(folioId, { bold: true }),
      tr(", en los siguientes términos:"),
    ]),
    p([]),
    p([tr("PRIMERO.", { bold: true }), tr(" Se aceptan los servicios y/o bienes descritos en la cotización adjunta en su totalidad, por el importe total indicado, incluyendo el Impuesto al Valor Agregado (IVA) correspondiente.")]),
    p([]),
    p([tr("SEGUNDO.", { bold: true }), tr(" Se instruye al proveedor a proceder con la prestación de los servicios y/o entrega de bienes en los términos y plazos convenidos.")]),
    p([]),
    p([tr("TERCERO.", { bold: true }), tr(" Ambas partes reconocen que la presente carta de aceptación, junto con la cotización de referencia, constituyen el acuerdo comercial para los efectos del Artículo "), tr("29-A del Código Fiscal de la Federación", { bold: true }), tr(" en cuanto a la acreditación de la existencia material de las operaciones.")]),
    p([]),
    p([tr("CUARTO.", { bold: true }), tr(" El comprobante fiscal digital (CFDI) correspondiente deberá expedirse por el proveedor conforme a lo dispuesto en los Artículos "), tr("29 y 29-A del Código Fiscal de la Federación", { bold: true }), tr(" y demás disposiciones aplicables.")]),
    p([]),
    p([]),
    signatureLine(`${RECEPTOR.firmante} | ${RECEPTOR.cargo}`),
    p([tr(RECEPTOR.nombre)]),
    p([tr(`RFC: ${RECEPTOR.rfc}`)]),
  ];
}

// ─── SECCIÓN 5: CONSTANCIA DE ENTREGA-RECEPCIÓN ────────────────────────────

function buildConstanciaEntrega(cfdi, partes, logos) {
  const { emisor: EMISOR, receptor: RECEPTOR } = partes;
  const { emisorLogo, receptorLogo } = logos || {};
  const folioId = cfdi._folioControl || cfdi.folio || "";
  const fechaRec = cfdi._fechaRecepcion || cfdi.fechaTimbrado || "";
  const uuid = cfdi.uuid || "[UUID-CFDI-COMPLETAR]";
  const isExcel = cfdi._fromExcel === true;

  return [
    sectionTitle("CONSTANCIA DE ENTREGA-RECEPCIÓN DE SERVICIOS"),
    p([]),
    p([tr("ANTECEDENTES", { bold: true, size: 24 })]),
    p([
      tr("La presente constancia se emite en relación al Folio de Control "),
      tr(folioId, { bold: true }),
      isExcel
        ? tr(`, correspondiente al folio de control pendiente de vinculación con UUID del CFDI timbrado,`)
        : tr(`, amparado por el CFDI con UUID `, {}),
      ...(!isExcel ? [tr(uuid, { bold: true })] : []),
      tr(` celebrado entre `),
      tr(EMISOR.nombre, { bold: true }),
      tr(" (en adelante el PROVEEDOR) y "),
      tr(RECEPTOR.nombre, { bold: true }),
      tr(" (en adelante el RECEPTOR)."),
    ]),
    p([]),
    p([tr("CLÁUSULAS", { bold: true, size: 24 })]),
    p([]),
    p([tr("PRIMERA — MATERIALIDAD DE LAS OPERACIONES (Art. 29 y 29-A CFF).", { bold: true }), tr(" Las partes hacen constar que los servicios y/o bienes a que se refiere la cotización y carta de aceptación antes descritas fueron efectivamente prestados y recibidos en la fecha indicada, en cumplimiento estricto con lo establecido en los Artículos "), tr("29 y 29-A del Código Fiscal de la Federación", { bold: true }), tr(", que obligan a los contribuyentes a documentar sus operaciones con comprobantes fiscales que acrediten la materialidad de las mismas.")]),
    p([]),
    p([tr("SEGUNDA — COMPROBACIÓN FISCAL.", { bold: true }), tr(" El CFDI correspondiente a las operaciones descritas fue expedido conforme a la normatividad del Servicio de Administración Tributaria (SAT), y los conceptos consignados en el mismo corresponden fielmente a los servicios y/o bienes efectivamente entregados.")]),
    p([]),
    p([tr("TERCERA — PRESUNCIÓN DE INEXISTENCIA (Art. 69-B CFF).", { bold: true }), tr(" Las partes declaran, bajo protesta de decir verdad, que ninguna de ellas se encuentra en los supuestos previstos por el Artículo "), tr("69-B del Código Fiscal de la Federación", { bold: true }), tr(" relativos a la emisión o uso de comprobantes que amparen operaciones simuladas o inexistentes (EDOS/EFOS), y que la presente operación cuenta con plena sustancia económica.")]),
    p([]),
    p([tr("CUARTA — DOCUMENTACIÓN DE SOPORTE.", { bold: true }), tr(" Como soporte de la presente constancia, forman parte integrante del expediente los siguientes documentos: (i) Carta de Solicitud de Servicios, (ii) Cotización, (iii) Carta de Aceptación de Cotización, (iv) el CFDI correspondiente y (v) la presente Constancia de Entrega-Recepción.")]),
    p([]),
    p([tr("QUINTA — CONFORMIDAD.", { bold: true }), tr(" Ambas partes firman la presente constancia en señal de conformidad, haciendo constar la efectiva realización de la operación comercial en los términos descritos.")]),
    p([]),
    p([tr(`En Guadalajara, Jalisco, a ${fechaRec || new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}.`)]),
    p([]),
    p([]),

    // Tabla de firmas (PROVEEDOR | RECEPTOR)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        trow([
          tc([p([tr("PROVEEDOR", { bold: true, color: COLORS.NAVY })], { align: AlignmentType.CENTER })], { shading: COLORS.GRAY_LIGHT }),
          tc([p([tr("RECEPTOR", { bold: true, color: COLORS.NAVY })], { align: AlignmentType.CENTER })], { shading: COLORS.GRAY_LIGHT }),
        ]),
        trow([
          tc([logoParagraph(EMISOR.nombre, emisorLogo), p([])]),
          tc([logoParagraph(RECEPTOR.nombre, receptorLogo), p([])]),
        ]),
        trow([
          tc([
            p([]),
            p([]),
            signatureLine(EMISOR.firmante),
            p([tr(EMISOR.cargo, { size: 18 })]),
            p([tr(EMISOR.nombre, { size: 18 })]),
            p([tr(`RFC: ${EMISOR.rfc}`, { size: 18 })]),
          ]),
          tc([
            p([]),
            p([]),
            signatureLine(RECEPTOR.firmante),
            p([tr(RECEPTOR.cargo, { size: 18 })]),
            p([tr(RECEPTOR.nombre, { size: 18 })]),
            p([tr(`RFC: ${RECEPTOR.rfc}`, { size: 18 })]),
          ]),
        ]),
      ],
    }),

    p([]),
    p([]),
    // TARJETA DE RECEPCIÓN
    p([tr("TARJETA DE RECEPCIÓN", { bold: true, size: 24, color: COLORS.NAVY })]),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        trow([
          tc([p([tr("Folio:", { bold: true }), tr(` ${folioId}`)])]),
          tc([p([tr("Fecha de Recepción:", { bold: true }), tr(` ${fechaRec}`)])]),
        ]),
        trow([
          tc([p([tr("UUID CFDI:", { bold: true })])]),
          tc([p([tr(uuid)])]),
        ]),
        trow([
          tc([
            p([tr("Recibido conforme por:", { bold: true })]),
            p([]),
            p([]),
            signatureLine("Nombre y firma del receptor"),
            p([tr("Sello de recepción:", { bold: true })]),
            p([]),
            p([tr("[  ESPACIO PARA SELLO  ]", { color: COLORS.GRAY_TEXT, italics: true })], { align: AlignmentType.CENTER }),
          ], { width: 100 }),
        ]),
      ],
    }),
  ];
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Genera un archivo .docx con las 5 secciones del expediente de materialidad.
 *
 * @param {Object} cfdi  — datos del CFDI (o folio mapeado con folioToCfdi)
 * @param {string|Array} [aiSections] — texto IA o array de {label, content}
 * @param {Object} [options] — opciones adicionales
 * @param {string} [options.receptorCompanyId] — id del fronting (receptor) para cargar membretado y logo
 * @param {string} [options.emisorCompanyId]   — id del emisor para cargar logo
 * @returns {Promise<Blob>} — Blob del archivo .docx listo para descargar
 */
export async function generateExpedienteDocx(cfdisInput, aiSections, options = {}) {
  // Backward compatibility: si es string, wrappear como array
  if (typeof aiSections === "string") {
    aiSections = aiSections ? [{ label: "DOCUMENTO GENERADO POR IA", content: aiSections, folioIdx: 0 }] : [];
  } else if (!aiSections) {
    aiSections = [];
  }

  // Normalizar: aceptar objeto único o array de CFDIs
  const cfdis = Array.isArray(cfdisInput) ? cfdisInput : [cfdisInput];
  if (cfdis.length === 0) return null;

  const cfdi0 = cfdis[0]; // para logos/membretado (empresa compartida en todo el batch)
  const { emisorCompanyId } = options;

  // Auto-detectar empresa por RFC del receptor si no se indicó explícitamente
  const receptorCompanyId =
    options.receptorCompanyId ||
    findFrontingByRfc(cfdi0.receptor?.rfc)?.id ||
    null;

  // Cargar imágenes en paralelo (no bloquean si fallan)
  const [membretadoData, receptorLogoData, emisorLogoData] = await Promise.all([
    fetchMembretado(receptorCompanyId),
    fetchLogo(receptorCompanyId),
    fetchLogo(emisorCompanyId),
  ]);

  const logos = {
    emisorLogo: emisorLogoData,
    receptorLogo: receptorLogoData,
  };

  // Nombres cortos para el header (empresa compartida por todo el batch)
  const partes0 = resolvePartes(cfdi0);
  const emisorCorto = (partes0.emisor.nombre.split(",")[0] || "").trim().slice(0, 20);
  const receptorCorto = (partes0.receptor.nombre.split(",")[0] || "").trim().slice(0, 20);

  // Propiedades de página comunes
  const PAGE_PROPS = { page: { margin: { top: 1000, right: 900, bottom: 1000, left: 900 } } };

  // DocTypes del receptor (el fronting firma/escribe) → llevan membretado
  const RECEPTOR_DOC_TYPES = new Set([
    "solicitud_servicios", "solicitud_insumos", "solicitud_materiales",
    "aceptacion_servicios", "aceptacion_insumos",
    "bitacora_supervision",
  ]);

  const wordSections = [];

  for (const [idx, cfdi] of cfdis.entries()) {
    const partes = resolvePartes(cfdi);
    const folioId = cfdi._folioControl || cfdi.folio || `SIN-FOLIO-${idx + 1}`;
    const cfdiAISections = aiSections.filter((s) => (s.folioIdx ?? 0) === idx);

    // Crea una sección Word con/sin membretado para este folio
    // Cada llamada produce un Header nuevo (el docx library no puede reusar instancias entre secciones)
    const docSection = (children, withMembretado = false) => ({
      headers: { default: makeHeader(folioId, emisorCorto, receptorCorto, withMembretado ? membretadoData : null) },
      footers: { default: makeEmptyFooter() },
      properties: PAGE_PROPS,
      children,
    });

    wordSections.push(
      // 1. Portada — sin membretado (hoja de resumen neutral)
      docSection(buildPortada(cfdi, partes, logos), false),
      // 2. Carta de Solicitud — CON membretado (receptor solicita al emisor)
      docSection(buildCartaSolicitud(cfdi, partes, logos), true),
      // 3. Cotización — sin membretado (emisor cotiza al receptor)
      docSection(buildCotizacion(cfdi, partes, logos), false),
      // 4. Carta de Aceptación — CON membretado (receptor acepta la cotización)
      docSection(buildCartaAceptacion(cfdi, partes, logos), true),
      // 5. Constancia de Entrega-Recepción — sin membretado (documento conjunto)
      docSection(buildConstanciaEntrega(cfdi, partes, logos), false),
      // Documentos IA — membretado según quién es el autor del tipo de documento
      ...cfdiAISections.map((section) => {
        const useMembretado = RECEPTOR_DOC_TYPES.has(section.docTypeId);
        return docSection([
          sectionTitle(section.label),
          p([tr("⚠ Solo para referencia — verificar antes de uso procesal", { bold: true, color: COLORS.RED })]),
          p([]),
          ...section.content.split("\n").map((line) => p([tr(line.trim())])),
        ], useMembretado);
      }),
    );
  }

  const folioLabel = cfdis.length === 1
    ? (cfdis[0]._folioControl || cfdis[0].folio || "SIN-FOLIO")
    : `BATCH-${cfdis.length}F`;

  const doc = new Document({
    creator: "CFDI-GEN — Itosturre Legaltech",
    title: `Expediente ${folioLabel}`,
    description: "Expediente de materialidad fiscal generado por CFDI-GEN",
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
    },
    sections: wordSections,
  });

  return Packer.toBlob(doc);
}
