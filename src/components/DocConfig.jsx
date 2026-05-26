import { DOCUMENT_TYPES, RUBROS } from "../utils/constants";

/**
 * DocConfig — Paso 3: Configuración del documento
 * Selección del tipo de documento, rubro de la empresa e instrucciones
 */
export default function DocConfig({ cfdi, docType, setDocType, rubro, setRubro, instrExtra, setInstrExtra, onBack, onGenerate, generating }) {
  const availableDocs = cfdi ? (DOCUMENT_TYPES[cfdi.tipo] || DOCUMENT_TYPES.I) : DOCUMENT_TYPES.I;

  return (
    <div className="animate-slideUp">
      <div className="glass-card-strong" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        {/* Document Type Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            1. Documento a generar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {availableDocs.map((d) => (
              <label
                key={d.id}
                className={`radio-card ${docType === d.id ? "selected" : ""}`}
                style={{ fontSize: "0.875rem" }}
              >
                <input
                  type="radio"
                  name="docType"
                  value={d.id}
                  checked={docType === d.id}
                  onChange={(e) => setDocType(e.target.value)}
                />
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    background: docType === d.id ? "var(--accent-primary)" : "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <i
                    className={`ti ${d.icon}`}
                    style={{
                      fontSize: "16px",
                      color: docType === d.id ? "white" : "var(--text-secondary)",
                    }}
                    aria-hidden="true"
                  />
                </div>
                <span>{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Industry / Rubro Selection */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            2. Rubro de la empresa emisora
          </label>
          <select
            value={rubro}
            onChange={(e) => setRubro(e.target.value)}
          >
            <option value="" disabled>— Selecciona el sector de la empresa —</option>
            {RUBROS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
            Ayuda a la IA a adaptar la terminología y cláusulas específicas al sector.
          </p>
        </div>

        {/* Additional Instructions */}
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            3. Instrucciones adicionales <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
          </label>
          <textarea
            value={instrExtra}
            onChange={(e) => setInstrExtra(e.target.value)}
            placeholder="Ej: incluir cláusula de penalización por retraso, agregar datos del almacén de destino, mención a NOM aplicable..."
            rows={3}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onBack} disabled={generating} style={{ padding: "0.625rem 1rem" }}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </button>
        <button
          onClick={onGenerate}
          disabled={!docType || !rubro || generating}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          {generating ? (
            <>
              <i
                className="ti ti-loader-2"
                style={{ fontSize: "18px", animation: "spin 0.8s linear infinite" }}
                aria-hidden="true"
              />
              Generando documento...
            </>
          ) : (
            <>
              <i className="ti ti-sparkles" style={{ fontSize: "18px" }} aria-hidden="true" />
              Generar con IA
            </>
          )}
        </button>
      </div>
    </div>
  );
}
