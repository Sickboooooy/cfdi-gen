import { useRef, useState } from "react";

/**
 * FileUpload — Paso 1: Drop zone para cargar CFDI (.xml)
 * Drag & drop con animaciones + clic para seleccionar
 */
export default function FileUpload({ onFileParsed }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".xml") && file.type !== "text/xml") {
      onFileParsed(null, null, "Por favor selecciona un archivo .xml de CFDI.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileParsed(e.target.result, file.name);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="animate-slideUp">
      <div
        role="button"
        tabIndex={0}
        aria-label="Cargar archivo XML del CFDI"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current.click()}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current.click()}
        className="glass-card"
        style={{
          padding: "3.5rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "all var(--transition-base)",
          borderColor: dragOver ? "var(--accent-primary)" : undefined,
          background: dragOver ? "rgba(99, 102, 241, 0.06)" : undefined,
          boxShadow: dragOver ? "0 0 32px rgba(99, 102, 241, 0.15)" : undefined,
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xml"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
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
          }}
        >
          <i
            className="ti ti-file-type-xml"
            style={{
              fontSize: "36px",
              color: "var(--accent-primary-light)",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Text */}
        <p style={{ fontWeight: 500, fontSize: "1rem", marginBottom: "0.375rem" }}>
          Arrastra tu CFDI aquí
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          o haz clic para seleccionar un archivo .xml
        </p>

        {/* Compatibility badge */}
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
          <i className="ti ti-shield-check" style={{ fontSize: "14px" }} aria-hidden="true" />
          Compatible con CFDI 3.3 y 4.0
        </span>
      </div>
    </div>
  );
}
