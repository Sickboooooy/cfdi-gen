import { useRef, useState } from "react";

/**
 * UploadZone — Componente genérico de drag-and-drop reutilizable.
 *
 * Props:
 *   accept      {string}   — tipos MIME / extensiones (.xml, .xlsx)
 *   onFile      {Function} — callback(file: File)
 *   icon        {string}   — clase de icono Tabler (ej: "ti-file-type-xml")
 *   iconColor   {string}   — color CSS del icono (default: var(--accent-primary-light))
 *   title       {string}   — texto principal
 *   subtitle    {string}   — texto secundario
 *   badge       {string}   — texto del badge de compatibilidad
 *   badgeIcon   {string}   — clase del icono del badge
 *   disabled    {boolean}  — deshabilitar la zona
 *   hint        {ReactNode} — contenido extra debajo del badge
 */
export default function UploadZone({
  accept = "*",
  onFile,
  icon = "ti-upload",
  iconColor = "var(--accent-primary-light)",
  title = "Arrastra tu archivo aquí",
  subtitle = "o haz clic para seleccionar",
  badge = "",
  badgeIcon = "ti-shield-check",
  disabled = false,
  hint = null,
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || disabled) return;
    onFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={title}
      aria-disabled={disabled}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !disabled && fileRef.current.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && fileRef.current.click()}
      className="glass-card"
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all var(--transition-base)",
        borderColor: dragOver ? "var(--accent-primary)" : undefined,
        background: dragOver ? "rgba(99, 102, 241, 0.06)" : undefined,
        boxShadow: dragOver ? "0 0 32px rgba(99, 102, 241, 0.15)" : undefined,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
      />

      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "var(--radius-lg)",
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
          animation: dragOver ? "none" : "float 3s ease-in-out infinite",
          transition: "all var(--transition-base)",
        }}
      >
        <i
          className={`ti ${icon}`}
          style={{ fontSize: "36px", color: iconColor }}
          aria-hidden="true"
        />
      </div>

      {/* Text */}
      <p style={{ fontWeight: 500, fontSize: "1rem", marginBottom: "0.375rem" }}>
        {title}
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
        {subtitle}
      </p>

      {/* Badge */}
      {badge && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.75rem",
            padding: "0.375rem 0.875rem",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-tertiary)",
            background: "var(--bg-surface)",
          }}
        >
          <i className={`ti ${badgeIcon}`} style={{ fontSize: "14px" }} aria-hidden="true" />
          {badge}
        </span>
      )}

      {/* Hint extra */}
      {hint && <div style={{ marginTop: "1rem" }}>{hint}</div>}
    </div>
  );
}
