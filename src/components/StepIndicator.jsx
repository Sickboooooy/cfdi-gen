/**
 * StepIndicator — Stepper visual de 4 pasos
 * Steps conectados con líneas animadas, glow en paso activo
 */
export default function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: "Cargar archivo", icon: "ti-upload" },
    { n: 2, label: "Revisar datos", icon: "ti-list-search" },
    { n: 3, label: "Configurar", icon: "ti-settings" },
    { n: 4, label: "Documento", icon: "ti-file-check" },
  ];

  return (
    <div
      className="animate-fadeIn"
      style={{
        display: "flex",
        gap: "0.25rem",
        marginBottom: "1.75rem",
        padding: "0 0.25rem",
      }}
    >
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;

        return (
          <div key={s.n} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* Progress bar */}
            <div
              style={{
                height: "3px",
                borderRadius: "2px",
                background: done
                  ? "var(--accent-success)"
                  : active
                    ? "linear-gradient(90deg, var(--accent-primary), var(--accent-primary-light))"
                    : "var(--border-subtle)",
                transition: "all 0.5s ease",
                boxShadow: active ? "0 0 8px rgba(99, 102, 241, 0.4)" : "none",
              }}
            />

            {/* Step info */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  background: done
                    ? "rgba(16, 185, 129, 0.15)"
                    : active
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                  color: done
                    ? "var(--accent-success-light)"
                    : active
                      ? "var(--accent-primary-light)"
                      : "var(--text-muted)",
                  border: `1px solid ${
                    done
                      ? "rgba(16, 185, 129, 0.3)"
                      : active
                        ? "rgba(99, 102, 241, 0.3)"
                        : "var(--border-subtle)"
                  }`,
                  animation: active ? "pulse-glow 2.5s ease-in-out infinite" : "none",
                }}
              >
                {done ? (
                  <i className="ti ti-check" style={{ fontSize: "12px" }} aria-hidden="true" />
                ) : (
                  s.n
                )}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: active ? 500 : 400,
                  color: active
                    ? "var(--accent-primary-light)"
                    : done
                      ? "var(--text-secondary)"
                      : "var(--text-muted)",
                  transition: "color 0.3s ease",
                }}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
