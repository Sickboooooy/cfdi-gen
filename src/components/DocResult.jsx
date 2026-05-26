import { useState, useEffect } from "react";
import { loadSheetJS, exportToExcel } from "../utils/excelExport";

/**
 * DocResult — Paso 4: Documento Generado
 * Renderiza el texto de la IA con la regla obligatoria DEMO (watermarks -35deg, opacidad escalonada)
 */
export default function DocResult({ cfdi, docType, rubro, result, onReset, onNewDoc }) {
  const [copied, setCopied] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Cargar SheetJS dinámicamente al llegar a este paso
  useEffect(() => {
    loadSheetJS().then(setXlsxLoaded);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar", err);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      exportToExcel(cfdi, docType, rubro, result);
      setExporting(false);
    }, 100); // Pequeño delay para que React renderice el estado de carga
  };

  return (
    <div className="animate-slideUp">
      {/* Container principal del documento */}
      <div
        className="glass-card-strong"
        style={{
          overflow: "hidden",
          marginBottom: "1rem",
        }}
      >
        {/* Header del documento */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-file-check" style={{ color: "var(--accent-success-light)", fontSize: "16px" }} aria-hidden="true" />
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Documento generado</span>
            <span
              style={{
                fontSize: "0.625rem",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(239, 68, 68, 0.15)",
                color: "var(--accent-danger-light)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              DEMO
            </span>
          </div>

          <button
            onClick={handleCopy}
            style={{
              fontSize: "0.75rem",
              padding: "0.375rem 0.75rem",
              background: copied ? "var(--accent-success)" : "var(--bg-surface)",
              color: copied ? "white" : "var(--text-primary)",
              borderColor: copied ? "var(--accent-success)" : "var(--border-subtle)",
            }}
          >
            <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: "14px" }} aria-hidden="true" />
            {copied ? "Copiado ✓" : "Copiar texto"}
          </button>
        </div>

        {/* Cuerpo del documento con Watermarks */}
        <div
          style={{
            position: "relative",
            background: "var(--bg-surface)",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {/* Capas de Watermark "NO VÁLIDO" - REGLA DEMO OBLIGATORIA */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed", // fijo respecto al viewport o contenedor scrollable
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-35deg)",
                fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "rgba(239, 68, 68, 0.13)",
                whiteSpace: "nowrap",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              NO VÁLIDO
            </div>
            <div
              style={{
                position: "absolute",
                top: "calc(50% + 120px)",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-35deg)",
                fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "rgba(239, 68, 68, 0.10)",
                whiteSpace: "nowrap",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              NO VÁLIDO
            </div>
            <div
              style={{
                position: "absolute",
                top: "calc(50% - 120px)",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-35deg)",
                fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "rgba(239, 68, 68, 0.08)",
                whiteSpace: "nowrap",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              NO VÁLIDO
            </div>
          </div>

          {/* Texto renderizado */}
          <pre
            style={{
              margin: 0,
              padding: "1.5rem 2rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
              color: "var(--text-primary)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {result}
          </pre>
        </div>
      </div>

      {/* Advertencia Legal Itosturre */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem",
        }}
      >
        <i
          className="ti ti-alert-triangle"
          style={{ fontSize: "20px", color: "var(--accent-warning-light)", flexShrink: 0, marginTop: "2px" }}
          aria-hidden="true"
        />
        <div style={{ fontSize: "0.75rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--accent-warning-light)" }}>Documento generado por IA</strong> — verificar datos y citas legales antes de su uso procesal o fiscal.
          <div style={{ marginTop: "0.25rem", color: "var(--text-secondary)" }}>
            Fuentes oficiales: <strong>sat.gob.mx</strong> · <strong>dof.gob.mx</strong> · <strong>cff.gob.mx</strong> · <strong>sjf.scjn.gob.mx</strong>
          </div>
        </div>
      </div>

      {/* Export to Excel */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleExport}
          disabled={!xlsxLoaded || exporting}
          className="btn-success"
          style={{ width: "100%", padding: "0.875rem", fontSize: "0.875rem", fontWeight: 600 }}
        >
          {exporting ? (
            <>
              <i className="ti ti-loader-2" style={{ fontSize: "18px", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
              Generando archivo...
            </>
          ) : !xlsxLoaded ? (
            <>
              <i className="ti ti-loader-2" style={{ fontSize: "18px", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
              Preparando motor Excel...
            </>
          ) : (
            <>
              <i className="ti ti-file-spreadsheet" style={{ fontSize: "20px" }} aria-hidden="true" />
              Exportar a Excel — 3 hojas: Datos CFDI · Conceptos · Documento
            </>
          )}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Compatible con Claude in Excel · Abre y ejecuta <strong>/audit-xls</strong> para validación automática
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onNewDoc} style={{ flex: 1 }}>
          <i className="ti ti-refresh" aria-hidden="true" />
          Otro documento (mismo CFDI)
        </button>
        <button onClick={onReset} style={{ flex: 1, background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary-light)", borderColor: "rgba(99, 102, 241, 0.2)" }}>
          <i className="ti ti-plus" aria-hidden="true" />
          Nuevo CFDI
        </button>
      </div>
    </div>
  );
}
