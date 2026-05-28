import { DOCUMENT_TYPES_BATCH, RUBROS } from "../utils/constants";

/**
 * DocConfig — Paso 3: Selección múltiple de documentos (checkboxes)
 * Todos los documentos están pre-seleccionados
 * Incluye "Seleccionar todo / Deseleccionar todo"
 */
export default function DocConfig({
  cfdi,
  selectedDocTypes,
  setSelectedDocTypes,
  rubro,
  setRubro,
  instrExtra,
  setInstrExtra,
  isDisabled,
  onBack,
  onGenerate,
}) {
  // Lógica de select all / deselect all
  const allSelected = selectedDocTypes.length === DOCUMENT_TYPES_BATCH.length;
  const toggleAll = () => {
    if (allSelected) {
      setSelectedDocTypes([]);
    } else {
      setSelectedDocTypes(DOCUMENT_TYPES_BATCH.map((dt) => dt.id));
    }
  };

  // Toggle individual checkbox
  const toggleType = (id) => {
    setSelectedDocTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="animate-slideUp">
      <div className="glass-card-strong" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        {/* Header: Select all / Deselect all */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              1. Documentos a generar
            </div>
            <button
              onClick={toggleAll}
              disabled={isDisabled}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                backgroundColor: allSelected ? "var(--accent-primary)" : "var(--bg-surface)",
                color: allSelected ? "white" : "var(--text-primary)",
                border: `1px solid ${allSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {allSelected ? "✓ Deseleccionar todo" : "Seleccionar todo"}
            </button>
          </div>

          {/* Checkboxes grid 2x3 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {DOCUMENT_TYPES_BATCH.map((dt) => (
              <label
                key={dt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: `2px solid ${selectedDocTypes.includes(dt.id) ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  backgroundColor: selectedDocTypes.includes(dt.id)
                    ? "rgba(99, 102, 241, 0.08)"
                    : "transparent",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDocTypes.includes(dt.id)}
                  onChange={() => toggleType(dt.id)}
                  disabled={isDisabled}
                  style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                />
                <span style={{ fontSize: "1.25rem" }}>{dt.icon}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{dt.label}</span>
              </label>
            ))}
          </div>

          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {selectedDocTypes.length} documento{selectedDocTypes.length !== 1 ? "s" : ""} seleccionado{selectedDocTypes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rubro Selection */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            2. Rubro de la empresa emisora
          </label>
          <select
            value={rubro}
            onChange={(e) => setRubro(e.target.value)}
            disabled={isDisabled}
          >
            <option value="" disabled>
              — Selecciona el sector de la empresa —
            </option>
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
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onBack} disabled={isDisabled} style={{ padding: "0.625rem 1rem" }}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </button>
        <button
          onClick={() => onGenerate(selectedDocTypes)}
          disabled={selectedDocTypes.length === 0 || !rubro || isDisabled}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          {isDisabled ? (
            <>
              <i
                className="ti ti-loader-2"
                style={{ fontSize: "18px", animation: "spin 0.8s linear infinite" }}
                aria-hidden="true"
              />
              Generando {selectedDocTypes.length} documento{selectedDocTypes.length !== 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <i className="ti ti-sparkles" style={{ fontSize: "18px" }} aria-hidden="true" />
              Generar {selectedDocTypes.length} documento{selectedDocTypes.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
