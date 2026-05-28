import ExportButtons from "./ExportButtons";

/**
 * DocResult — Paso 4: Generación Batch con Progreso (múltiples folios)
 * Muestra progreso en tiempo real durante la generación secuencial
 * Luego muestra lista de documentos completados + botón de exportación Word único
 */
export default function DocResult({
  cfdis,
  selectedFolios,
  rubro,
  isGenerating,
  progress,
  results,
  onReset,
  onNewDoc,
}) {
  const successCount = results.filter((r) => !r.error).length;
  const errorCount = results.filter((r) => r.error).length;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="animate-slideUp">
      {/* Durante generación: Barra de progreso + Lista parcial */}
      {isGenerating && (
        <div className="glass-card-strong" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Generando documentos...
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {progress.current} de {progress.total}
              </span>
            </div>

            {/* Barra de progreso */}
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg, var(--accent-primary), var(--accent-success-light))",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                margin: "0.75rem 0 0 0",
              }}
            >
              <i
                className="ti ti-loader-2"
                style={{
                  animation: "spin 0.8s linear infinite",
                  marginRight: "0.5rem",
                }}
                aria-hidden="true"
              />
              {progress.currentLabel}
            </p>
          </div>

          {/* Documentos completados hasta ahora */}
          {results.length > 0 && (
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                Completados
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.map((result, idx) => (
                  <div
                    key={`${result.folio}-${result.docTypeId}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      background: result.error ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                    }}
                  >
                    <i
                      className={`ti ${result.error ? "ti-x" : "ti-check"}`}
                      style={{
                        color: result.error ? "var(--accent-danger-light)" : "var(--accent-success-light)",
                        fontSize: "16px",
                      }}
                      aria-hidden="true"
                    />
                    <span style={{ fontSize: "0.75rem" }}>
                      {result.folio && (
                        <span style={{ color: "var(--text-muted)", marginRight: "0.25rem" }}>
                          [{result.folio}]
                        </span>
                      )}
                      {result.label}
                      {result.error && (
                        <span style={{ color: "var(--accent-danger-light)", marginLeft: "0.5rem" }}>
                          — Error
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cuando termina: Resumen + Botón de exportación único */}
      {!isGenerating && results.length > 0 && (
        <div className="glass-card-strong" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="ti ti-file-check"
                  style={{ color: "var(--accent-success-light)", fontSize: "18px" }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {successCount} documento{successCount !== 1 ? "s" : ""} generado{successCount !== 1 ? "s" : ""} ({cfdis?.length || 1} folio{cfdis?.length !== 1 ? "s" : ""})
                </div>
                {errorCount > 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-danger-light)" }}>
                    {errorCount} con error
                  </div>
                )}
              </div>
            </div>
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

          {/* Lista de documentos */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {results.map((result, idx) => (
                <div
                  key={`${result.folio}-${result.docTypeId}-${idx}`}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${result.error ? "var(--border-danger)" : "var(--border-success)"}`,
                    background: result.error ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <i
                      className={`ti ${result.error ? "ti-x" : "ti-check"}`}
                      style={{
                        color: result.error ? "var(--accent-danger-light)" : "var(--accent-success-light)",
                        fontSize: "16px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {result.folio && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            [{result.folio}]{" "}
                          </span>
                        )}
                        {result.label}
                      </div>
                      {result.error && (
                        <div style={{ fontSize: "0.75rem", color: "var(--accent-danger-light)", marginTop: "0.25rem" }}>
                          Error: {result.error}
                        </div>
                      )}
                      {!result.error && (
                        <div
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--text-muted)",
                            marginTop: "0.25rem",
                            lineHeight: 1.4,
                            maxHeight: "60px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {result.content.substring(0, 150)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de exportación único */}
          <ExportButtons cfdis={cfdis} results={results} rubro={rubro} disabled={successCount === 0} />
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onNewDoc} disabled={isGenerating} style={{ padding: "0.875rem 1.25rem" }}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Generar otro documento
        </button>
        <button onClick={onReset} disabled={isGenerating} className="btn-secondary" style={{ padding: "0.875rem 1.25rem" }}>
          <i className="ti ti-home" aria-hidden="true" />
          Cargar otro Excel
        </button>
      </div>
    </div>
  );
}
