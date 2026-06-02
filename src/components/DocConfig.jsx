import { DOCUMENT_TYPES_BATCH, RUBROS, getDocTypesByTipo } from "../utils/constants";

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
  selectedCompany,
}) {
  // Tipos de documentos según la empresa seleccionada
  const docTypes = selectedCompany
    ? getDocTypesByTipo(selectedCompany.tipo)
    : DOCUMENT_TYPES_BATCH;

  const allSelected = selectedDocTypes.length === docTypes.length;
  const toggleAll = () => {
    if (allSelected) {
      setSelectedDocTypes([]);
    } else {
      setSelectedDocTypes(docTypes.map((dt) => dt.id));
    }
  };

  const toggleType = (id) => {
    setSelectedDocTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const efectivoRubro = selectedCompany?.rubro || rubro;

  return (
    <div className="animate-slideUp">
      <div className="glass-card-strong" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>

        {/* Badge de empresa seleccionada */}
        {selectedCompany && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            marginBottom: "1.25rem",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8125rem",
          }}>
            <i className="ti ti-building" style={{ fontSize: "14px", color: "var(--accent-primary-light)" }} aria-hidden="true" />
            <span style={{ fontWeight: 600, color: "var(--accent-primary-light)" }}>{selectedCompany.nombre}</span>
            <span style={{
              fontSize: "0.6875rem",
              padding: "1px 7px",
              background: "rgba(99,102,241,0.15)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-primary-light)",
            }}>
              {selectedCompany.tipo === "ambos" ? "Servicios + Materiales" : selectedCompany.tipo.charAt(0).toUpperCase() + selectedCompany.tipo.slice(1)}
            </span>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "auto" }}>
              {selectedCompany.rubro}
            </span>
          </div>
        )}

        {/* Header: Select all / Deselect all */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
          }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              1. Documentos a generar
              {selectedCompany && (
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>
                  — según ficha técnica de {selectedCompany.nombre.split(",")[0]}
                </span>
              )}
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

          {/* Checkboxes grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "0.75rem",
          }}>
            {docTypes.map((dt) => (
              <label
                key={dt.id}
                title={dt.description || ""}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
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
                  style={{ cursor: isDisabled ? "not-allowed" : "pointer", marginTop: "2px", flexShrink: 0 }}
                />
                {dt.icon && dt.icon.startsWith("ti-") ? (
                  <i className={`ti ${dt.icon}`} style={{ fontSize: "1.1rem", marginTop: "1px", flexShrink: 0 }} aria-hidden="true" />
                ) : (
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{dt.icon}</span>
                )}
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{dt.label}</div>
                  {dt.description && (
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      {dt.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {selectedDocTypes.length} documento{selectedDocTypes.length !== 1 ? "s" : ""} seleccionado{selectedDocTypes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rubro — solo manual si no hay empresa seleccionada */}
        {!selectedCompany ? (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              2. Rubro de la empresa emisora
            </label>
            <select
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              disabled={isDisabled}
            >
              <option value="" disabled>— Selecciona el sector de la empresa —</option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
              Ayuda a la IA a adaptar la terminología y cláusulas específicas al sector.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              2. Rubro de la empresa
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
            }}>
              <i className="ti ti-tag" style={{ fontSize: "14px", color: "var(--accent-success-light)" }} aria-hidden="true" />
              <span style={{ color: "var(--accent-success-light)", fontWeight: 500 }}>{selectedCompany.rubro}</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                Derivado de la ficha técnica
              </span>
            </div>
          </div>
        )}

        {/* Additional Instructions */}
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            {selectedCompany ? "3." : "3."} Instrucciones adicionales{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
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
          onClick={() => onGenerate(selectedDocTypes, efectivoRubro)}
          disabled={selectedDocTypes.length === 0 || (!efectivoRubro) || isDisabled}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          {isDisabled ? (
            <>
              <i className="ti ti-loader-2" style={{ fontSize: "18px", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
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
