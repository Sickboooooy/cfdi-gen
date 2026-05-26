/**
 * Hook para generación de documentos con Anthropic API
 *
 * El prompt incluye obligatoriamente:
 * - UUID del CFDI como referencia explícita
 * - Citas de Arts. 29 y 29-A CFF como mínimo
 * - Redacción jurídico-fiscal mexicana con cláusulas numeradas
 * - RFC de emisor y receptor en el cuerpo del documento
 * - Espacios para firma de ambas partes
 * - Mención al rubro del sector para adaptar terminología
 * - El documento debe servir como prueba de materialidad ante SAT
 */

import { useState, useCallback } from "react";
import { TIPO_MAP, ALL_DOC_TYPES } from "../utils/constants";
import { fmt } from "../utils/formatters";

/**
 * Construye el prompt completo para la generación del documento.
 */
function buildPrompt(cfdi, docType, rubro, instrExtra) {
  const docLabel = ALL_DOC_TYPES.find((d) => d.id === docType)?.label || docType;
  const conceptosText = cfdi.conceptos
    .map(
      (c, i) =>
        `  ${i + 1}. ${c.descripcion} | Clave SAT: ${c.claveProdServ || "N/D"} | Cant: ${c.cantidad} ${c.claveUnidad || ""} (${c.unidad || ""}) | V.U.: $${fmt(c.valorUnitario)} | Importe: $${fmt(c.importe)}`
    )
    .join("\n");

  return `Eres un especialista en documentación fiscal y jurídica mexicana con experiencia en el Código Fiscal de la Federación (CFF), SAT y derecho corporativo.

Genera el documento formal completo del tipo: "${docLabel}"

═══════════════ DATOS DEL CFDI ═══════════════
UUID (Folio Fiscal): ${cfdi.uuid || "No disponible"}
Serie/Folio: ${cfdi.serie || "-"}/${cfdi.folio || "-"}
Fecha de emisión: ${cfdi.fecha || "N/D"}
Fecha de timbrado: ${cfdi.fechaTimbrado || "N/D"}
Tipo de comprobante: ${TIPO_MAP[cfdi.tipo] || cfdi.tipo}
Versión CFDI: ${cfdi.version}
Lugar de expedición (CP): ${cfdi.lugarExpedicion || "N/D"}
Moneda: ${cfdi.moneda}
Subtotal: $${fmt(cfdi.subtotal)}
Total impuestos trasladados: $${fmt(cfdi.totalImpuestos || "0")}
Total: $${fmt(cfdi.total)}
Forma de pago: ${cfdi.formaPago || "N/D"}
Método de pago: ${cfdi.metodoPago || "N/D"}

EMISOR:
  RFC: ${cfdi.emisor.rfc}
  Razón Social: ${cfdi.emisor.nombre}
  Régimen Fiscal: ${cfdi.emisor.regimen || "N/D"}

RECEPTOR:
  RFC: ${cfdi.receptor.rfc}
  Razón Social / Nombre: ${cfdi.receptor.nombre}
  Uso del CFDI: ${cfdi.receptor.usoCFDI || "N/D"}
  CP Domicilio Fiscal Receptor: ${cfdi.receptor.domicilioFiscal || "N/D"}

CONCEPTOS FACTURADOS:
${conceptosText}

RUBRO DE LA EMPRESA EMISORA: ${rubro}

${instrExtra ? `INSTRUCCIONES ADICIONALES DEL USUARIO:\n${instrExtra}\n` : ""}═══════════════════════════════════════════════

INSTRUCCIONES DE GENERACIÓN (OBLIGATORIAS):
1. El documento debe ser completo, formal y servir como soporte documental de materialidad ante una revisión del SAT o procedimiento de verificación conforme al CFF.
2. Redacta en español formal jurídico-fiscal mexicano.
3. Incluye encabezado con lugar y fecha, antecedentes, cuerpo con cláusulas numeradas (cuando aplique), declaraciones de las partes y espacios para firmas.
4. Integra explícitamente el UUID del CFDI como referencia: "${cfdi.uuid || "Ver CFDI adjunto"}"
5. Incluye el RFC de ambas partes (emisor: ${cfdi.emisor.rfc}, receptor: ${cfdi.receptor.rfc}) en el cuerpo del documento.
6. Cita obligatoriamente los artículos 29 y 29-A del Código Fiscal de la Federación (CFF) como fundamento legal, así como cualquier otra norma aplicable al tipo de operación (art. 31 LISR, art. 5 LIVA si corresponde).
7. Adapta la terminología y cláusulas específicas al rubro "${rubro}" — usa el lenguaje técnico propio del sector.
8. Incluye espacios claramente delimitados para firma de ambas partes (emisor y receptor), con línea, nombre completo y RFC debajo.
9. El documento debe poder imprimirse y firmarse directamente, con formato formal de documento jurídico.

Genera ÚNICAMENTE el texto del documento. Sin explicaciones previas, sin notas externas, sin metadatos.`;
}

/**
 * Hook personalizado para la generación de documentos.
 *
 * @returns {{ generate, generating, result, error, clearResult }}
 */
export function useDocGenerator() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async (cfdi, docType, rubro, instrExtra) => {
    // Obtener API key de localStorage — NUNCA se loguea en consola
    const apiKey = localStorage.getItem("itosturre_anthropic_key");
    if (!apiKey) {
      setError("Se requiere una API key de Anthropic. Haz clic en el ícono de llave (🔑) en el encabezado para configurarla.");
      return null;
    }

    setGenerating(true);
    setError("");

    // --- MOCK MODE PARA DEMO ---
    if (apiKey.trim().toLowerCase() === "demo") {
      return new Promise((resolve) => {
        setTimeout(() => {
          const docLabel = ALL_DOC_TYPES.find((d) => d.id === docType)?.label || docType;
          const dummyText = `DOCUMENTO GENERADO EN MODO SIMULADO (API KEY = "demo")
TIPO: ${docLabel}
RUBRO: ${rubro}

En la ciudad de Guadalajara, Jalisco, a los ${new Date().getDate()} días del mes actual...

DECLARACIONES:
I. Que el emisor con RFC ${cfdi.emisor.rfc} expidió el CFDI con UUID: ${cfdi.uuid || "N/D"}.
II. Que el receptor con RFC ${cfdi.receptor.rfc} está conforme con las partidas facturadas por un total de $${fmt(cfdi.total)}.

CLÁUSULAS:
PRIMERA. El presente documento ampara la materialidad de la operación en términos de los Arts. 29 y 29-A del Código Fiscal de la Federación (CFF).

SEGUNDA. Este texto es meramente ilustrativo para probar la funcionalidad de la interfaz y la generación de Excel. No se hizo una llamada real a Anthropic.

(Espacios para firmas)

___________________________           ___________________________
Emisor: ${cfdi.emisor.rfc}              Receptor: ${cfdi.receptor.rfc}`;
          
          setResult(dummyText);
          setGenerating(false);
          resolve(dummyText);
        }, 1200); // delay simulado
      });
    }

    const prompt = buildPrompt(cfdi, docType, rubro, instrExtra);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Error de la API de Anthropic");
      }

      const text = (data.content || []).map((b) => b.text || "").join("");
      if (!text) {
        throw new Error("La API no devolvió contenido. Intente de nuevo.");
      }

      setResult(text);
      setGenerating(false);
      return text;
    } catch (err) {
      const msg = err.message || "Error desconocido";
      if (msg.includes("401") || msg.includes("authentication")) {
        setError("API key inválida. Verifica tu clave de Anthropic en la configuración.");
      } else if (msg.includes("429")) {
        setError("Límite de solicitudes excedido. Espera un momento e intenta de nuevo.");
      } else {
        setError("Error al generar documento: " + msg);
      }
      setGenerating(false);
      return null;
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult("");
    setError("");
  }, []);

  return { generate, generating, result, error, setError, clearResult };
}
