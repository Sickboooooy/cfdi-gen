import { useState, useCallback, useEffect } from "react";
import { DOCUMENT_TYPES_BATCH, TIPO_MAP } from "../utils/constants";
import { fmt } from "../utils/formatters";
import { sanitizeUserInput } from "../utils/sanitize";
import { logEvent } from "../utils/auditLog";

// ─── Rate limit ──────────────────────────────────────────────────────────────
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  minInterval: 3000,
  blockMs: 30 * 1000,
};

function checkRateLimit() {
  const now = Date.now();

  const lastReq = parseInt(sessionStorage.getItem("cfdi_last_req") || "0");
  if (now - lastReq < RATE_LIMIT.minInterval) {
    return { allowed: false };
  }

  const windowStart = parseInt(sessionStorage.getItem("cfdi_req_window") || "0");
  const reqCount = parseInt(sessionStorage.getItem("cfdi_req_count") || "0");

  if (now - windowStart > RATE_LIMIT.windowMs) {
    sessionStorage.setItem("cfdi_req_window", String(now));
    sessionStorage.setItem("cfdi_req_count", "0");
    return { allowed: true };
  }

  if (reqCount >= RATE_LIMIT.maxRequests) {
    return { allowed: false };
  }

  return { allowed: true };
}

function recordRequest() {
  sessionStorage.setItem("cfdi_last_req", String(Date.now()));
  const count = parseInt(sessionStorage.getItem("cfdi_req_count") || "0");
  sessionStorage.setItem("cfdi_req_count", String(count + 1));
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(cfdi, docLabel, rubro, instrExtra) {
  const isExcel = cfdi._fromExcel === true;

  const productos = isExcel
    ? (cfdi._productosRaw || []).map(
        (p, i) =>
          `  ${i + 1}. ${p.desc} | Cant: ${p.cantidad} | V.U.: $${fmt(p.valorUnitario)} | Importe: $${fmt(p.importe)}`
      ).join("\n")
    : cfdi.conceptos
        .map(
          (c, i) =>
            `  ${i + 1}. ${c.descripcion} | Clave SAT: ${c.claveProdServ || "N/D"} | Cant: ${c.cantidad} ${c.claveUnidad || ""} (${c.unidad || ""}) | V.U.: $${fmt(c.valorUnitario)} | Importe: $${fmt(c.importe)}`
        )
        .join("\n");

  const referenciaFiscal = isExcel
    ? `Folio de Control: ${cfdi._folioControl || cfdi.folio || "N/D"} (correspondiente al folio de control pendiente de vinculación con UUID del CFDI timbrado)`
    : `UUID (Folio Fiscal): ${cfdi.uuid || "No disponible"}`;

  const fechasExpediente = isExcel
    ? `Fecha de Solicitud: ${cfdi._fechaSolicitud || "N/D"}
Fecha de Cotización: ${cfdi._fechaCotizacion || "N/D"}
Fecha de Aceptación: ${cfdi._fechaAceptacion || "N/D"}
Fecha de Recepción: ${cfdi._fechaRecepcion || "N/D"}`
    : `Fecha de emisión: ${cfdi.fecha || "N/D"}
Fecha de timbrado: ${cfdi.fechaTimbrado || "N/D"}`;

  const instruccionUUID = isExcel
    ? `4. La operación se identifica como "correspondiente al folio de control ${cfdi._folioControl || cfdi.folio}, pendiente de vinculación con UUID del CFDI timbrado" — NO menciones un UUID específico.`
    : `4. Integra explícitamente el UUID del CFDI como referencia: "${cfdi.uuid || "Ver CFDI adjunto"}"`;

  return `Eres un especialista en documentación fiscal y jurídica mexicana con experiencia en el Código Fiscal de la Federación (CFF), SAT y derecho corporativo.

Genera el documento formal completo del tipo: "${docLabel}"

═══════════════ DATOS DEL EXPEDIENTE ═══════════════
${referenciaFiscal}
${fechasExpediente}
Tipo de comprobante: ${TIPO_MAP[cfdi.tipo] || cfdi.tipo}
Moneda: ${cfdi.moneda || "MXN"}
Subtotal: $${fmt(cfdi.subtotal)}
Total impuestos trasladados: $${fmt(cfdi.totalImpuestos || "0")}
Total: $${fmt(cfdi.total)}
${cfdi._totalLetra ? `Total con letra: ${cfdi._totalLetra}` : ""}
${!isExcel ? `Forma de pago: ${cfdi.formaPago || "N/D"}
Método de pago: ${cfdi.metodoPago || "N/D"}` : ""}

EMISOR:
  RFC: ${cfdi.emisor.rfc}
  Razón Social: ${cfdi.emisor.nombre}
  Régimen Fiscal: ${cfdi.emisor.regimen || "N/D"}

RECEPTOR:
  RFC: ${cfdi.receptor.rfc}
  Razón Social / Nombre: ${cfdi.receptor.nombre}
  Uso del CFDI: ${cfdi.receptor.usoCFDI || "N/D"}

PRODUCTOS / CONCEPTOS:
${productos}

RUBRO DE LA EMPRESA EMISORA: ${rubro}

${instrExtra ? `INSTRUCCIONES ADICIONALES DEL USUARIO:\n${instrExtra}\n` : ""}═══════════════════════════════════════════════

INSTRUCCIONES DE GENERACIÓN (OBLIGATORIAS):
1. El documento debe ser completo, formal y servir como soporte documental de materialidad ante una revisión del SAT o procedimiento de verificación conforme al CFF.
2. Redacta en español formal jurídico-fiscal mexicano.
3. Incluye encabezado con lugar y fecha, antecedentes, cuerpo con cláusulas numeradas (cuando aplique), declaraciones de las partes y espacios para firmas.
${instruccionUUID}
5. Incluye el RFC de ambas partes (emisor: ${cfdi.emisor.rfc}, receptor: ${cfdi.receptor.rfc}) en el cuerpo del documento.
6. Cita obligatoriamente los artículos 29 y 29-A del Código Fiscal de la Federación (CFF) como fundamento legal, así como cualquier otra norma aplicable al tipo de operación (art. 31 LISR, art. 5 LIVA si corresponde).
7. Adapta la terminología y cláusulas específicas al rubro "${rubro}" — usa el lenguaje técnico propio del sector.
8. Incluye espacios claramente delimitados para firma de ambas partes (emisor y receptor), con línea, nombre completo y RFC debajo.
9. El documento debe poder imprimirse y firmarse directamente, con formato formal de documento jurídico.

Genera ÚNICAMENTE el texto del documento. Sin explicaciones previas, sin notas externas, sin metadatos.`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDocGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentLabel: "" });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [rateLimitedUntil, setRateLimitedUntil] = useState(0);

  // Countdown visible en ErrorBanner mientras dura el bloqueo
  useEffect(() => {
    if (rateLimitedUntil <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setRateLimitedUntil(0);
        setError("");
      } else {
        setError(
          `Límite de generación alcanzado. Espera ${remaining} segundo${remaining !== 1 ? "s" : ""} antes de continuar.`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  const generateBatch = useCallback(async (cfdis, docTypeIds, rubro, instrExtra) => {
    // Leer API key de sessionStorage justo antes del fetch — nunca en estado React
    const apiKey = sessionStorage.getItem("cfdi_api_key") || "";
    const grokKey = import.meta.env.VITE_GROK_API_KEY || "";

    if (!apiKey && !grokKey) {
      setError("Se requiere una API key de Anthropic. Haz clic en el ícono de llave (🔑) en el encabezado para configurarla.");
      return;
    }

    if (apiKey && apiKey.length > 300) {
      setError("La API key parece inválida (demasiado larga).");
      return;
    }

    const cfdiArray = Array.isArray(cfdis) ? cfdis : [cfdis];
    if (cfdiArray.length === 0) {
      setError("No hay CFDIs para procesar.");
      return;
    }

    // Sanitizar inputs del usuario antes de incluirlos en el prompt
    const cleanRubro = sanitizeUserInput(rubro || "", 100);
    if (cleanRubro !== (rubro || "").trim()) logEvent("INPUT_SANITIZADO", "rubro filtrado");

    const cleanInstr = sanitizeUserInput(instrExtra || "", 500);
    if (cleanInstr !== (instrExtra || "").trim()) logEvent("INPUT_SANITIZADO", "instrExtra filtrado");

    setIsGenerating(true);
    setError("");
    setResults([]);

    const selectedTypes = DOCUMENT_TYPES_BATCH.filter((dt) => docTypeIds.includes(dt.id));
    const total = cfdiArray.length * selectedTypes.length;
    let count = 0;

    try {
      for (let folioIdx = 0; folioIdx < cfdiArray.length; folioIdx++) {
        const cfdi = cfdiArray[folioIdx];
        const folioLabel = cfdi.folio || cfdi._folioControl || `Folio ${folioIdx + 1}`;

        for (let typeIdx = 0; typeIdx < selectedTypes.length; typeIdx++) {
          const { id, label } = selectedTypes[typeIdx];
          count++;
          setProgress({ current: count, total, currentLabel: `${folioLabel} — ${label}` });

          try {
            let content;

            if (apiKey && apiKey.trim().toLowerCase() === "demo") {
              await new Promise((r) => setTimeout(r, 800));
              content = `DOCUMENTO GENERADO EN MODO DEMO
TIPO: ${label}
RUBRO: ${cleanRubro}
FOLIO: ${folioLabel}

En la ciudad de Guadalajara, Jalisco, a los ${new Date().getDate()} días del mes actual...

DECLARACIONES:
I. Que el emisor con RFC ${cfdi.emisor.rfc} expidió el CFDI correspondiente al folio ${cfdi.folio || "N/D"}.
II. Que el receptor con RFC ${cfdi.receptor.rfc} está conforme con las partidas por un total de $${fmt(cfdi.total)}.

CLÁUSULAS:
PRIMERA. El presente documento ampara la materialidad de la operación en términos de los Arts. 29 y 29-A del Código Fiscal de la Federación (CFF).

SEGUNDA. Este documento fue generado en modo demo y es únicamente para demostración de funcionalidad.

(Espacios para firmas)

___________________________           ___________________________
Emisor: ${cfdi.emisor.rfc}              Receptor: ${cfdi.receptor.rfc}`;
            } else {
              // Verificar rate limit antes de cada llamada real
              const rl = checkRateLimit();
              if (!rl.allowed) {
                logEvent("RATE_LIMIT_HIT", `folio ${folioLabel}, doc ${label}`);
                const until = Date.now() + RATE_LIMIT.blockMs;
                setRateLimitedUntil(until);
                setIsGenerating(false);
                return;
              }

              recordRequest();

              const prompt = buildPrompt(cfdi, label, cleanRubro, cleanInstr);

              if (apiKey) {
                // Intentar Anthropic primero; si falla, usar Grok como fallback
                try {
                  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key": apiKey,
                      "anthropic-version": "2023-06-01",
                      "anthropic-dangerous-direct-browser-access": "true",
                    },
                    body: JSON.stringify({
                      model: "claude-sonnet-4-6",
                      max_tokens: 4000,
                      messages: [{ role: "user", content: prompt }],
                    }),
                  });
                  const anthropicData = await anthropicRes.json();
                  if (anthropicData.error) throw new Error(anthropicData.error.message || "Error de la API de Anthropic");
                  content = (anthropicData.content || []).map((b) => b.text || "").join("");
                  if (!content) throw new Error("Anthropic no devolvió contenido.");
                  logEvent("AI_PROVIDER", "anthropic");
                } catch (anthropicErr) {
                  logEvent("AI_FALLBACK", `Anthropic falló (${anthropicErr.message}), usando Grok 4`);
                  if (!grokKey) throw new Error(`Anthropic falló y no hay clave de Grok configurada. Error original: ${anthropicErr.message}`);
                  const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${grokKey}` },
                    body: JSON.stringify({ model: "grok-4.3", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
                  });
                  const grokData = await grokRes.json();
                  if (grokData.error) throw new Error(grokData.error.message || "Error de la API de Grok");
                  content = grokData.choices?.[0]?.message?.content || "";
                  if (!content) throw new Error("Grok no devolvió contenido.");
                  logEvent("AI_PROVIDER", "grok-4.3-fallback");
                }
              } else {
                // Sin key de Anthropic — usar Grok directamente
                logEvent("AI_PROVIDER", "grok-4.3-directo");
                const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${grokKey}` },
                  body: JSON.stringify({ model: "grok-4.3", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
                });
                const grokData = await grokRes.json();
                if (grokData.error) throw new Error(grokData.error.message || "Error de la API de Grok");
                content = grokData.choices?.[0]?.message?.content || "";
                if (!content) throw new Error("Grok no devolvió contenido.");
              }
            }

            logEvent("DOC_GENERADO", `${folioLabel} — ${label}`);
            setResults((prev) => [...prev, { docTypeId: id, label, content, folio: folioLabel, folioIdx }]);
          } catch (err) {
            const msg = err.message || "Error desconocido";
            setResults((prev) => [...prev, { docTypeId: id, label, content: "", error: msg, folio: folioLabel, folioIdx }]);
          }
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress({ current: 0, total: 0, currentLabel: "" });
    setError("");
  }, []);

  return { generateBatch, isGenerating, progress, results, error, setError, clearResults, rateLimitedUntil };
}
