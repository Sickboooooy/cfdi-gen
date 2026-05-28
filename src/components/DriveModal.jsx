/**
 * DriveModal — Modal de Drive: instrucciones de configuración o confirmación de upload
 *
 * Props:
 *   configured  {boolean}  — si hay Client ID configurado
 *   loading     {boolean}  — si está subiendo
 *   progress    {string}   — mensaje de progreso
 *   result      {Object}   — { docxLink?, xlsxLink?, error? }
 *   folio       {string}   — folio de control
 *   onClose     {Function} — cerrar modal
 */
export default function DriveModal({ configured, loading, progress, result, folio, onClose }) {
  const isError = result?.error && result.error !== "not_configured" && result.error !== "auth_cancelled";
  const isSuccess = result && !result.error;
  const notConfigured = !configured || result?.error === "not_configured";
  const authCancelled = result?.error === "auth_cancelled";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 8, 16, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Google Drive"
    >
      <div
        className="glass-card-strong"
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "1.75rem",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: notConfigured ? "rgba(100, 116, 139, 0.15)" : "rgba(66, 133, 244, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <i
                className={`ti ${isSuccess ? "ti-circle-check" : isError ? "ti-alert-triangle" : "ti-brand-google-drive"}`}
                style={{
                  fontSize: "18px",
                  color: isSuccess ? "var(--accent-success-light)" : isError ? "var(--accent-danger-light)" : "#74aeff",
                }}
                aria-hidden="true"
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
              {isSuccess ? "Guardado en Drive" : isError ? "Error en Drive" : "Google Drive"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0, borderRadius: "50%" }}
            aria-label="Cerrar"
          >
            <i className="ti ti-x" style={{ fontSize: "16px" }} aria-hidden="true" />
          </button>
        </div>

        {/* ─── Estado: Cargando ─────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <i
              className="ti ti-loader-2"
              style={{
                fontSize: "40px",
                color: "#74aeff",
                animation: "spin 1s linear infinite",
                display: "block",
                marginBottom: "1rem",
              }}
              aria-hidden="true"
            />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{progress}</p>
          </div>
        )}

        {/* ─── Estado: No configurado ──────────────────────── */}
        {!loading && notConfigured && (
          <>
            <div style={{
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
            }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--accent-warning-light)", fontWeight: 600, marginBottom: "0.5rem" }}>
                <i className="ti ti-info-circle" style={{ marginRight: "6px" }} aria-hidden="true" />
                Drive no configurado
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Para activar el respaldo automático en Google Drive, necesitas un <strong>OAuth 2.0 Client ID</strong>.
              </p>
            </div>

            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              Cómo obtenerlo:
            </p>
            <ol style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 2, paddingLeft: "1.25rem", marginBottom: "1.25rem" }}>
              <li>Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#74aeff" }}>console.cloud.google.com</a></li>
              <li>Crea un proyecto (o usa uno existente)</li>
              <li><strong>APIs & Services</strong> → <strong>Library</strong> → busca <em>Google Drive API</em> → Enable</li>
              <li><strong>APIs & Services</strong> → <strong>Credentials</strong> → <strong>+ Create Credentials</strong> → <em>OAuth 2.0 Client ID</em></li>
              <li>Tipo: <strong>Web application</strong></li>
              <li>Authorized JavaScript origins: <code style={{ background: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>http://localhost:5173</code></li>
              <li>Copia el <strong>Client ID</strong> generado</li>
              <li>Pégalo en tu archivo <code style={{ background: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>.env</code>:</li>
            </ol>
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.625rem 0.875rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--accent-primary-light)",
              marginBottom: "1.25rem",
            }}>
              VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <i className="ti ti-info-circle" style={{ marginRight: "4px" }} aria-hidden="true" />
              Mientras tanto, tus archivos se generan y descargan localmente. El historial de archivos se guarda en tu navegador.
            </p>
          </>
        )}

        {/* ─── Estado: Auth cancelado ───────────────────────── */}
        {!loading && authCancelled && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <i className="ti ti-user-off" style={{ fontSize: "36px", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }} aria-hidden="true" />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              La autenticación fue cancelada. Los archivos se guardaron localmente.
            </p>
          </div>
        )}

        {/* ─── Estado: Error ────────────────────────────────── */}
        {!loading && isError && (
          <div style={{
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
          }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--accent-danger-light)", marginBottom: "0.25rem", fontWeight: 600 }}>
              Error al subir a Drive
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {result.error}
            </p>
          </div>
        )}

        {/* ─── Estado: Éxito ────────────────────────────────── */}
        {!loading && isSuccess && (
          <>
            <div style={{
              padding: "1rem",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
            }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--accent-success-light)", fontWeight: 600, marginBottom: "0.5rem" }}>
                <i className="ti ti-circle-check" style={{ marginRight: "6px" }} aria-hidden="true" />
                Folio {folio} guardado en Drive
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Carpeta: CFDI-GEN / {folio}
              </p>
            </div>

            {result.docxLink && (
              <a
                href={result.docxLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(66, 133, 244, 0.1)",
                  border: "1px solid rgba(66, 133, 244, 0.2)",
                  borderRadius: "var(--radius-md)",
                  color: "#74aeff",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  marginBottom: "0.5rem",
                  transition: "all var(--transition-fast)",
                }}
              >
                <i className="ti ti-file-word" style={{ fontSize: "18px" }} aria-hidden="true" />
                Abrir expediente Word en Drive
                <i className="ti ti-external-link" style={{ fontSize: "14px", marginLeft: "auto" }} aria-hidden="true" />
              </a>
            )}
          </>
        )}

        {/* Botón cerrar */}
        {!loading && (
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ width: "100%", marginTop: "0.75rem" }}
          >
            {isSuccess ? "Listo" : "Entendido"}
          </button>
        )}
      </div>
    </div>
  );
}
