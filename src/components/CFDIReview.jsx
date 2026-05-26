import { TIPO_MAP, TIPO_COLOR } from "../utils/constants";
import { fmt, dateOnly } from "../utils/formatters";

/**
 * CFDIReview — Paso 2: Vista de datos parseados del CFDI
 * Cards glassmorphism, métricas, UUID, tabla de conceptos
 */
export default function CFDIReview({ cfdi, fileName, onBack, onNext }) {
  const tipoColors = TIPO_COLOR[cfdi.tipo] || TIPO_COLOR.I;

  return (
    <div className="animate-slideUp">
      <div className="glass-card-strong" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.125rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-circle-check" style={{ color: "var(--accent-success-light)", fontSize: "18px" }} aria-hidden="true" />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>CFDI parseado correctamente</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.6875rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "var(--radius-sm)",
                background: tipoColors.bg,
                color: tipoColors.text,
                border: `1px solid ${tipoColors.border}`,
                fontWeight: 600,
              }}
            >
              {TIPO_MAP[cfdi.tipo] || cfdi.tipo} ({cfdi.tipo})
            </span>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{fileName}</span>
          </div>
        </div>

        {/* Emisor / Receptor cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
          {[
            { label: "Emisor", main: cfdi.emisor.nombre, sub: cfdi.emisor.rfc, regime: cfdi.emisor.regimen },
            { label: "Receptor", main: cfdi.receptor.nombre, sub: cfdi.receptor.rfc, cp: cfdi.receptor.domicilioFiscal },
          ].map(({ label, main, sub, regime, cp }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.375rem",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "0.8125rem",
                  marginBottom: "0.125rem",
                  lineHeight: 1.4,
                }}
              >
                {main || "—"}
              </div>
              <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {sub}
              </div>
              {regime && (
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Régimen: {regime}
                </div>
              )}
              {cp && (
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                  CP: {cp}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "0.875rem" }}>
          {[
            ["Fecha", dateOnly(cfdi.fecha)],
            ["Total", `$${fmt(cfdi.total)}`],
            ["Moneda", cfdi.moneda],
            ["Conceptos", cfdi.conceptos.length],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.75rem",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.125rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {k}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Additional metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "0.875rem" }}>
          {[
            ["Subtotal", `$${fmt(cfdi.subtotal)}`],
            ["IVA", `$${fmt(cfdi.totalImpuestos || "0")}`],
            ["Forma Pago", cfdi.formaPago || "N/D"],
            ["Método Pago", cfdi.metodoPago || "N/D"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.75rem",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.125rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {k}
              </div>
              <div className={k.includes("Subtotal") || k.includes("IVA") ? "" : "mono"} style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* UUID */}
        {cfdi.uuid && (
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              UUID / Folio Fiscal
            </div>
            <div
              className="mono"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-primary-light)",
                wordBreak: "break-all",
                cursor: "pointer",
                padding: "0.375rem 0.625rem",
                background: "rgba(99, 102, 241, 0.06)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
              }}
              title="Clic para copiar"
              onClick={() => navigator.clipboard.writeText(cfdi.uuid)}
            >
              {cfdi.uuid}
            </div>
          </div>
        )}

        {/* Conceptos table */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Conceptos facturados
          </div>
          {cfdi.conceptos.slice(0, 5).map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: "0.8125rem",
                padding: "0.375rem 0",
                borderBottom:
                  i < Math.min(cfdi.conceptos.length, 5) - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              <div style={{ flex: 1, paddingRight: "0.75rem" }}>
                <span>{c.descripcion}</span>
                <span className="mono" style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  [{c.claveProdServ}]
                </span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {c.cantidad} {c.claveUnidad} ×
                </span>
                <span className="mono" style={{ marginLeft: "0.375rem", fontWeight: 500 }}>
                  ${fmt(c.importe)}
                </span>
              </div>
            </div>
          ))}
          {cfdi.conceptos.length > 5 && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", paddingTop: "0.375rem" }}>
              +{cfdi.conceptos.length - 5} conceptos adicionales
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onBack} style={{ padding: "0.625rem 1rem" }}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </button>
        <button onClick={onNext} className="btn-primary" style={{ flex: 1 }}>
          Continuar — Seleccionar documento
          <i className="ti ti-arrow-right" style={{ marginLeft: "0.25rem" }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
