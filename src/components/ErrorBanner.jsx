/**
 * ErrorBanner — Banner de error reutilizable
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="animate-slideDown"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.75rem 1rem",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "var(--radius-md)",
        marginBottom: "1rem",
        fontSize: "0.8125rem",
        color: "var(--accent-danger-light)",
        lineHeight: 1.5,
      }}
    >
      <i className="ti ti-alert-circle" style={{ fontSize: "18px", flexShrink: 0 }} aria-hidden="true" />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            width: 24,
            height: 24,
            padding: 0,
            background: "transparent",
            border: "none",
            color: "var(--accent-danger-light)",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-x" style={{ fontSize: "14px" }} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
