import { useState } from "react";

/**
 * ApiKeyModal — Modal para configurar API key de Anthropic
 *
 * SEGURIDAD:
 * - Campo tipo password
 * - NUNCA se loguea en consola
 * - Almacenamiento solo en localStorage
 * - Advertencia visible de que es solo para demo
 * - En producción la key nunca irá en cliente
 */
export default function ApiKeyModal({ isOpen, onClose }) {
  const [key, setKey] = useState(localStorage.getItem("itosturre_anthropic_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem("itosturre_anthropic_key", trimmed);
    } else {
      localStorage.removeItem("itosturre_anthropic_key");
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    localStorage.removeItem("itosturre_anthropic_key");
    setKey("");
    setSaved(false);
  };

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card-strong animate-slideUp"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: "1.75rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-key" style={{ fontSize: "18px", color: "var(--accent-primary-light)" }} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>API Key de Anthropic</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Requerida para generar documentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "18px" }} aria-hidden="true" />
          </button>
        </div>

        {/* Warning banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
            fontSize: "0.75rem",
            color: "var(--accent-warning-light)",
            lineHeight: 1.5,
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
          <div>
            <strong>Solo para demostración.</strong> La API key se almacena en tu navegador (localStorage) y nunca se envía a servidores externos.
            En producción, la key se manejará desde el servidor, nunca en el cliente.
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
            Clave API
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
              spellCheck="false"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                paddingRight: "2.75rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: 30,
                height: 30,
                padding: 0,
                background: "transparent",
                border: "none",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={showKey ? "Ocultar" : "Mostrar"}
            >
              <i className={`ti ti-eye${showKey ? "-off" : ""}`} style={{ fontSize: "16px" }} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {key && (
            <button
              onClick={handleRemove}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--accent-danger-light)",
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: "14px" }} aria-hidden="true" />
              Eliminar
            </button>
          )}
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ flex: 1, fontSize: "0.8125rem" }}
          >
            {saved ? (
              <>
                <i className="ti ti-check" style={{ fontSize: "16px" }} aria-hidden="true" />
                Guardada
              </>
            ) : (
              <>
                <i className="ti ti-device-floppy" style={{ fontSize: "16px" }} aria-hidden="true" />
                Guardar API Key
              </>
            )}
          </button>
        </div>

        {/* Privacy note */}
        <p style={{ marginTop: "0.75rem", fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <i className="ti ti-lock" style={{ fontSize: "12px", marginRight: "4px" }} aria-hidden="true" />
          Tu clave se guarda únicamente en este navegador. No se transmite a ningún servidor aparte de la API de Anthropic.
        </p>

        <p style={{ marginTop: "0.5rem", fontSize: "0.6875rem", color: "var(--accent-primary-light)", lineHeight: 1.5 }}>
          <i className="ti ti-bulb" style={{ fontSize: "12px", marginRight: "4px" }} aria-hidden="true" />
          <strong>Tip:</strong> Si no tienes una clave para probar, escribe <strong>demo</strong> para simular la generación y probar la exportación a Excel.
        </p>
      </div>
    </div>
  );
}
