/**
 * Constantes del sistema Itosturre — Generador CFF desde CFDI
 */

// Mapeo de TipoDeComprobante → Label legible
export const TIPO_MAP = {
  I: "Ingreso",
  E: "Egreso",
  T: "Traslado",
  N: "Nómina",
  P: "Pago",
};

// Colores semánticos por tipo de comprobante
export const TIPO_COLOR = {
  I: { bg: "rgba(99, 102, 241, 0.15)", text: "#818cf8", border: "rgba(99, 102, 241, 0.3)" },
  E: { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  T: { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
  N: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
  P: { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af", border: "rgba(156, 163, 175, 0.3)" },
};

// Documentos disponibles por tipo de CFDI
// Cada tipo tiene sus documentos específicos con icono Tabler
export const DOCUMENT_TYPES = {
  I: [
    { id: "contrato_compraventa", label: "Contrato de compraventa de mercancías", icon: "ti-file-text" },
    { id: "contrato_servicios", label: "Contrato de prestación de servicios", icon: "ti-briefcase" },
    { id: "constancia_entrega", label: "Constancia de entrega-recepción de mercancías", icon: "ti-truck-delivery" },
    { id: "nota_remision", label: "Nota de remisión / Acta de envío", icon: "ti-clipboard-list" },
    { id: "acta_recepcion", label: "Acta de recepción y conformidad", icon: "ti-checklist" },
    { id: "convenio_precio", label: "Convenio de precio pactado", icon: "ti-currency-dollar" },
  ],
  T: [
    { id: "carta_porte", label: "Carta porte (complemento)", icon: "ti-truck" },
    { id: "manifiesto_carga", label: "Manifiesto de carga y ruta", icon: "ti-route" },
    { id: "bitacora_transporte", label: "Bitácora de transporte", icon: "ti-map-pin" },
    { id: "constancia_entrega_destino", label: "Constancia de entrega en destino", icon: "ti-package" },
  ],
  E: [
    { id: "nota_credito", label: "Nota de crédito / Acuerdo de devolución", icon: "ti-receipt-refund" },
    { id: "carta_devolucion", label: "Carta de devolución de mercancía", icon: "ti-arrow-back" },
  ],
  P: [
    { id: "recibo_pago", label: "Recibo de aplicación de pago", icon: "ti-receipt" },
    { id: "constancia_liquidacion", label: "Constancia de liquidación de adeudo", icon: "ti-circle-check" },
  ],
  N: [
    { id: "recibo_nomina", label: "Recibo de nómina individual", icon: "ti-id" },
    { id: "constancia_laboral", label: "Constancia de relación laboral", icon: "ti-users" },
  ],
};

// Todos los tipos de documentos aplanados
export const ALL_DOC_TYPES = Object.values(DOCUMENT_TYPES).flat();

// Para compatibility con nueva arquitectura batch: array simple de tipos
export const DOCUMENT_TYPES_BATCH = [
  { id: "contrato_compraventa", label: "Contrato de Compraventa", icon: "📄" },
  { id: "contrato_servicios", label: "Contrato de Servicios", icon: "🤝" },
  { id: "constancia_entrega", label: "Constancia de Entrega", icon: "✅" },
  { id: "nota_remision", label: "Nota de Remisión", icon: "📋" },
  { id: "acta_recepcion", label: "Acta de Recepción", icon: "📝" },
  { id: "convenio_precio", label: "Convenio de Precio", icon: "💰" },
];

// ─── Tipos de documentos AVANZZA (según Fichas Técnicas) ─────────────────────

export const AVANZZA_DOC_TYPES_SERVICIOS = [
  { id: "solicitud_servicios", label: "Solicitud de Servicios", icon: "ti-send", description: "Carta formal del cliente solicitando el servicio al proveedor." },
  { id: "cotizacion", label: "Cotización", icon: "ti-currency-dollar", description: "Desglose de costos y narrativa descriptiva de los servicios." },
  { id: "aceptacion_servicios", label: "Aceptación de Servicios / Orden de Compra", icon: "ti-circle-check", description: "Aceptación de la cotización con bitácora y costo final." },
  { id: "bitacora_supervision", label: "Bitácora de Supervisión", icon: "ti-clipboard-list", description: "Tabla de desglose y seguimiento del servicio, firmada por ambas partes." },
  { id: "recepcion_trabajo", label: "Recepción de Trabajo", icon: "ti-file-check", description: "Escrito detallado que da por finalizado el servicio y lo entregado." },
];

export const AVANZZA_DOC_TYPES_INSUMOS = [
  { id: "solicitud_insumos", label: "Solicitud de Insumos/Materiales", icon: "ti-send", description: "Solicitud escrita del suministro de insumos o materiales." },
  { id: "cotizacion_insumos", label: "Cotización de Materiales", icon: "ti-currency-dollar", description: "Desglose detallado de materiales, costos y cantidades." },
  { id: "aceptacion_insumos", label: "Aceptación / Orden de Compra", icon: "ti-circle-check", description: "Aceptación con bitácora del material a adquirir y costo final." },
  { id: "ficha_entrega", label: "Ficha de Entrega", icon: "ti-package", description: "Ficha con productos entregados, domicilio, fecha y datos del cliente." },
];

/** Retorna los tipos de documentos según el tipo de empresa */
export function getDocTypesByTipo(tipo) {
  if (tipo === "servicios") return AVANZZA_DOC_TYPES_SERVICIOS;
  if (tipo === "insumos" || tipo === "materiales") return AVANZZA_DOC_TYPES_INSUMOS;
  if (tipo === "ambos") return [
    ...AVANZZA_DOC_TYPES_SERVICIOS,
    ...AVANZZA_DOC_TYPES_INSUMOS.filter((d) => !AVANZZA_DOC_TYPES_SERVICIOS.some((s) => s.id === d.id)),
  ];
  return DOCUMENT_TYPES_BATCH;
}

// 16 rubros configurados
export const RUBROS = [
  "Construcción y obra civil",
  "Comercio al por mayor",
  "Comercio al por menor",
  "Transporte y logística de mercancías",
  "Manufactura e industria",
  "Servicios profesionales (consultoría, asesoría)",
  "Tecnología de la información y software",
  "Salud y farmacéutica",
  "Alimentos y bebidas",
  "Servicios financieros y seguros",
  "Educación y capacitación",
  "Agropecuario y agroindustrial",
  "Publicidad y marketing",
  "Inmobiliario y arrendamiento",
  "Restaurantes y hostelería",
  "Otro",
];
