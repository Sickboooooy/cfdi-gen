/**
 * Parser de CFDI — agnóstico a namespace
 * Compatible con CFDI 3.3 (xmlns:cfdi="http://www.sat.gob.mx/cfd/3")
 *                y CFDI 4.0 (xmlns:cfdi="http://www.sat.gob.mx/cfd/4")
 *
 * Usa localName para ignorar prefijos de namespace del SAT.
 */

function getByLocalName(doc, localName) {
  const all = doc.getElementsByTagName("*");
  const results = [];
  for (const el of all) {
    if (el.localName === localName) results.push(el);
  }
  return results;
}

/**
 * Extrae atributo de un elemento, probando múltiples variantes de nombre.
 * Necesario porque CFDI 3.3 usa minúsculas en algunos atributos.
 */
function ga(el, ...attrs) {
  for (const a of attrs) {
    const v = el?.getAttribute(a);
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

/**
 * Parsea un string XML de CFDI y extrae todos los campos requeridos.
 *
 * Campos extraídos:
 * version, fecha, tipo, total, subtotal, moneda, serie, folio,
 * formaPago, metodoPago, lugarExpedicion,
 * emisor{rfc, nombre, regimen},
 * receptor{rfc, nombre, usoCFDI, domicilioFiscal},
 * conceptos[{claveProdServ, descripcion, cantidad, claveUnidad, unidad, valorUnitario, importe}],
 * totalImpuestos, uuid, noCertSAT, fechaTimbrado
 *
 * @param {string} xmlString — contenido del archivo .xml del CFDI
 * @returns {Object} datos parseados del CFDI
 * @throws {Error} si el XML es inválido o no contiene nodo Comprobante
 */
export function parseCFDI(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  // Verificar errores de parseo XML
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("XML inválido: el archivo no tiene estructura XML correcta.");
  }

  // Nodo raíz del comprobante
  const comprobante = getByLocalName(doc, "Comprobante")[0];
  if (!comprobante) {
    throw new Error("No se encontró el nodo Comprobante. Verifique que sea un CFDI del SAT.");
  }

  // Nodos principales
  const emisor = getByLocalName(doc, "Emisor")[0];
  const receptor = getByLocalName(doc, "Receptor")[0];
  const conceptoEls = getByLocalName(doc, "Concepto");
  const timbre = getByLocalName(doc, "TimbreFiscalDigital")[0];

  // Impuestos a nivel comprobante (no a nivel concepto)
  // Buscamos el nodo Impuestos que es hijo directo del Comprobante
  const impuestosNodes = getByLocalName(doc, "Impuestos");
  let impuestosComprobante = null;
  for (const imp of impuestosNodes) {
    // Solo el nodo Impuestos cuyo padre directo es Comprobante
    if (imp.parentElement?.localName === "Comprobante") {
      impuestosComprobante = imp;
      break;
    }
  }

  // Validaciones mínimas
  if (!emisor) {
    throw new Error("No se encontró el nodo Emisor en el CFDI.");
  }
  if (!receptor) {
    throw new Error("No se encontró el nodo Receptor en el CFDI.");
  }

  const rfcEmisor = ga(emisor, "Rfc", "RFC", "rfc");
  if (!rfcEmisor) {
    throw new Error("No se encontró RFC del emisor en el CFDI.");
  }

  return {
    // Datos del comprobante
    version: ga(comprobante, "Version", "version") || "?",
    fecha: ga(comprobante, "Fecha", "fecha"),
    tipo: ga(comprobante, "TipoDeComprobante") || "I",
    total: ga(comprobante, "Total", "total") || "0",
    subtotal: ga(comprobante, "SubTotal", "subTotal", "subtotal") || "0",
    moneda: ga(comprobante, "Moneda", "moneda") || "MXN",
    serie: ga(comprobante, "Serie", "serie"),
    folio: ga(comprobante, "Folio", "folio"),
    formaPago: ga(comprobante, "FormaPago", "formaPago"),
    metodoPago: ga(comprobante, "MetodoPago", "metodoPago"),
    lugarExpedicion: ga(comprobante, "LugarExpedicion", "lugarExpedicion"),

    // Emisor
    emisor: {
      rfc: rfcEmisor,
      nombre: ga(emisor, "Nombre", "nombre"),
      regimen: ga(emisor, "RegimenFiscal", "regimenFiscal"),
    },

    // Receptor — incluye DomicilioFiscalReceptor (CFDI 4.0)
    receptor: {
      rfc: ga(receptor, "Rfc", "RFC", "rfc"),
      nombre: ga(receptor, "Nombre", "nombre"),
      usoCFDI: ga(receptor, "UsoCFDI", "usoCFDI"),
      domicilioFiscal: ga(receptor, "DomicilioFiscalReceptor", "domicilioFiscalReceptor"),
    },

    // Conceptos facturados
    conceptos: [...conceptoEls].map((c) => ({
      claveProdServ: ga(c, "ClaveProdServ"),
      descripcion: ga(c, "Descripcion"),
      cantidad: ga(c, "Cantidad"),
      claveUnidad: ga(c, "ClaveUnidad"),
      unidad: ga(c, "Unidad"),
      valorUnitario: ga(c, "ValorUnitario"),
      importe: ga(c, "Importe"),
    })),

    // Impuestos a nivel comprobante
    totalImpuestos: ga(impuestosComprobante, "TotalImpuestosTrasladados"),

    // Timbre fiscal digital
    uuid: ga(timbre, "UUID"),
    noCertSAT: ga(timbre, "NoCertificadoSAT"),
    fechaTimbrado: ga(timbre, "FechaTimbrado"),
  };
}
