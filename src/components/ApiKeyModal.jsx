import { useState } from "react";
import { getRecentEvents } from "../utils/auditLog";

const STORAGE_KEY = "cfdi_api_key";

function maskKey(k) {
  if (!k || k.length < 8) return "••••••••";
  return "sk-ant-..." + k.slice(-4);
}

export default function ApiKeyModal({ isOpen, onClose }) {
  const [newKey, setNewKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [showLog, setShowLog] = useState(false);

  if (!isOpen) return null;

  // Leer solo para mostrar máscara — nunca en estado React
  const storedMask = sessionStorage.getItem(STORAGE_KEY)
    ? maskKey(sessionStorage.getItem(STORAGE_KEY))
    : null;

  const handleSave = () => {
    const trimmed = newKey.trim();
    if (trimmed) {
      sessionStorage.setItem(STORAGE_KEY, trimmed);
    }
    setNewKey("");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setNewKey("");
    setSaved(false);
    onClose();
  };

  const logEntries = showLog ? getRecentEvents(10) : [];

  return (
    <div
      className="animate-fadeIn"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card-strong animate-slideUp"
        style={{ width: "100%", maxWidth: 460, padding: "1.75rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 36, height: 36,
                borderRadius: "var(--radius-md)",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <i className="ti ti-key" style={{ fontSize: "18px", color: "var(--accent-primary-light)" }} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>API Key de Anthropic</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                {import.meta.env.VITE_GROK_API_KEY ? "Opcional — Grok 4 activo como respaldo" : "Requerida para generar documentos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0, borderRadius: "var(--radius-sm)", background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
          >
            <i className="ti ti-x" style={{ fontSize: "18px" }} aria-hidden="true" />
          </button>
        </div>

        {/* Warning */}
        <div
          style={{
            display: "flex", alignItems: "flex-start", gap: "0.5rem",
            padding: "0.75rem",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
            fontSize: "0.75rem", color: "var(--accent-warning-light)", lineHeight: 1.5,
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
          <div>
            <strong>Solo para demostración.</strong> La API key se almacena en sessionStorage (se elimina al cerrar la pestaña) y solo se transmite directamente a Anthropic.
            {import.meta.env.VITE_GROK_API_KEY && (
              <> Si no ingresas una key, los documentos se generarán automáticamente con <strong>Grok 4</strong>.</>
            )}
          </div>
        </div>

        {/* Key actual (enmascarada) */}
        {storedMask && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-success-light)" }}>
              <i className="ti ti-circle-check" style={{ fontSize: "14px" }} aria-hidden="true" />
              Key activa:&nbsp;<code style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>{storedMask}</code>
            </span>
            <button
              onClick={handleRemove}
              style={{
                fontSize: "0.75rem", padding: "0.2rem 0.6rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "var(--accent-danger-light)",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: "13px" }} aria-hidden="true" /> Eliminar
            </button>
          </div>
        )}

        {/* Input nueva key */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
            {storedMask ? "Reemplazar key" : "Clave API"}
          </label>
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck="false"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowLog((v) => !v)}
            style={{
              padding: "0.5rem 0.875rem",
              fontSize: "0.8125rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.35rem",
            }}
          >
            <i className="ti ti-list" style={{ fontSize: "14px" }} aria-hidden="true" />
            Registro
          </button>
          <button
            onClick={handleSave}
            disabled={!newKey.trim()}
            className="btn-primary"
            style={{ flex: 1, fontSize: "0.8125rem" }}
          >
            {saved ? (
              <><i className="ti ti-check" style={{ fontSize: "16px" }} aria-hidden="true" /> Guardada</>
            ) : (
              <><i className="ti ti-device-floppy" style={{ fontSize: "16px" }} aria-hidden="true" /> Guardar API Key</>
            )}
          </button>
        </div>

        {/* Audit log panel */}
        {showLog && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "var(--bg-deepest)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>
              Últimos eventos de sesión
            </p>
            {logEntries.length === 0 ? (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sin eventos registrados.</p>
            ) : (
              logEntries.map((e, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-secondary)",
                    padding: "0.25rem 0",
                    borderBottom: i < logEntries.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    display: "flex", gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    {new Date(e.timestamp).toLocaleTimeString("es-MX")}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--accent-primary-light)", flexShrink: 0 }}>
                    {e.evento}
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>{e.detalle}</span>
                </div>
              ))
            )}
          </div>
        )}

        <p style={{ marginTop: "0.75rem", fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <i className="ti ti-lock" style={{ fontSize: "12px", marginRight: "4px" }} aria-hidden="true" />
          La key vive solo en esta pestaña. Se elimina automáticamente al cerrar el navegador.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.6875rem", color: "var(--accent-primary-light)", lineHeight: 1.5 }}>
          <i className="ti ti-bulb" style={{ fontSize: "12px", marginRight: "4px" }} aria-hidden="true" />
          <strong>Tip:</strong> Escribe <strong>demo</strong> para simular la generación sin consumir créditos.
        </p>
      </div>
    </div>
  );
}
