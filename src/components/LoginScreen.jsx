import { useState, useEffect } from "react";
import { logEvent } from "../utils/auditLog";

const VALID_USER = import.meta.env.VITE_DEMO_USER;
const VALID_PASS = import.meta.env.VITE_DEMO_PASS;

const MAX_FAILS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos

function getLockoutUntil() {
  return parseInt(sessionStorage.getItem("cfdi_lockout_until") || "0");
}

function getFailCount() {
  return parseInt(sessionStorage.getItem("cfdi_login_fails") || "0");
}

export default function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [locked, setLocked] = useState(() => Date.now() < getLockoutUntil());
  const [countdown, setCountdown] = useState(() =>
    Math.max(0, Math.ceil((getLockoutUntil() - Date.now()) / 1000))
  );

  // Countdown del bloqueo
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((getLockoutUntil() - Date.now()) / 1000);
      if (remaining <= 0) {
        sessionStorage.removeItem("cfdi_lockout_until");
        sessionStorage.removeItem("cfdi_login_fails");
        setLocked(false);
        setCountdown(0);
        setError("");
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 500));

    if (usuario.trim() === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem("cfdi_auth", "true");
      sessionStorage.setItem("cfdi_user", usuario.trim());
      sessionStorage.removeItem("cfdi_login_fails");
      logEvent("LOGIN_OK", `usuario: ${usuario.trim()}`);
      onLogin(usuario.trim());
    } else {
      const fails = getFailCount() + 1;
      sessionStorage.setItem("cfdi_login_fails", String(fails));
      logEvent("LOGIN_FAIL", `intento ${fails}`);

      if (fails >= MAX_FAILS) {
        const until = Date.now() + LOCKOUT_MS;
        sessionStorage.setItem("cfdi_lockout_until", String(until));
        setLocked(true);
        setCountdown(Math.ceil(LOCKOUT_MS / 1000));
      } else {
        setError("Credenciales incorrectas");
      }

      setPassword("");
      setLoading(false);
    }
  };

  const minutesLeft = Math.ceil(countdown / 60);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-deepest)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)",
          padding: "2.25rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem", gap: "0.75rem" }}>
          <div
            style={{
              width: 60, height: 60,
              borderRadius: 14,
              background: "#062241",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="56" cy="42" r="18" stroke="white" strokeWidth="8" />
              <line x1="43" y1="55" x2="26" y2="72" stroke="white" strokeWidth="12" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "0.04em", color: "var(--text-primary)", lineHeight: 1, fontFamily: "system-ui, -apple-system, sans-serif" }}>
              AVANZZA
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.3rem", fontWeight: 500 }}>
              Consultores Fiscales
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Bloqueo por intentos */}
          {locked && (
            <div
              style={{
                padding: "0.75rem 0.875rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--accent-danger-light)",
                fontSize: "0.8125rem",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              <i className="ti ti-lock" style={{ fontSize: "16px", display: "block", marginBottom: "0.25rem" }} aria-hidden="true" />
              Demasiados intentos fallidos.
              <br />
              Espera{" "}
              <strong>
                {minutesLeft} minuto{minutesLeft !== 1 ? "s" : ""}
              </strong>{" "}
              ({countdown}s) antes de continuar.
            </div>
          )}

          {/* Error credenciales */}
          {!locked && error && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--accent-danger-light)",
                fontSize: "0.8125rem",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}
            >
              <i className="ti ti-alert-circle" style={{ fontSize: "15px", flexShrink: 0 }} aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Usuario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label htmlFor="login-user" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
              Usuario
            </label>
            <input
              id="login-user"
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading || locked}
              required
              style={{
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "border-color var(--transition-fast)",
                opacity: loading || locked ? 0.5 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label htmlFor="login-pass" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-pass"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || locked}
                required
                style={{
                  width: "100%",
                  padding: "0.625rem 2.5rem 0.625rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                  opacity: loading || locked ? 0.5 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                disabled={locked}
                style={{
                  position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                  padding: "0.125rem", display: "flex", alignItems: "center",
                }}
              >
                <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: "17px" }} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || locked}
            className="btn-primary"
            style={{
              marginTop: "0.5rem", padding: "0.75rem", fontSize: "0.9375rem", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2" style={{ fontSize: "16px", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                Verificando...
              </>
            ) : locked ? (
              <>
                <i className="ti ti-lock" style={{ fontSize: "16px" }} aria-hidden="true" />
                Bloqueado ({countdown}s)
              </>
            ) : (
              <>
                <i className="ti ti-login" style={{ fontSize: "16px" }} aria-hidden="true" />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Sistema Itosturre · Legaltech B2B
      </p>
    </div>
  );
}
