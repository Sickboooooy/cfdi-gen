import { useState } from "react";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import UploadZone from "./components/UploadZone";
import FolioCard from "./components/FolioCard";
import CFDIReview from "./components/CFDIReview";
import DocConfig from "./components/DocConfig";
import DocResult from "./components/DocResult";
import ApiKeyModal from "./components/ApiKeyModal";
import ErrorBanner from "./components/ErrorBanner";
import { parseExcelControl, folioToCfdi } from "./utils/parseExcelControl";
import { useDocGenerator } from "./hooks/useDocGenerator";

/**
 * App — Flujo de 3 pasos (Excel only)
 *
 * Paso 1: Carga de Excel de control
 * Paso 2: Revisión y selección de folio
 * Paso 3: Configurar tipo de documento y rubro
 * Paso 4: Documento generado + exportación (.docx / .xlsx / Drive)
 */
export default function App() {
  // ─── Estado del flujo ───────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Excel
  const [folios, setFolios] = useState([]);
  const [selectedFolios, setSelectedFolios] = useState([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelParsing, setExcelParsing] = useState(false);

  // CFDIs de los folios seleccionados
  const [cfdis, setCfdis] = useState([]);

  // Config del documento (batch)
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [rubro, setRubro] = useState("");
  const [instrExtra, setInstrExtra] = useState("");

  // Modal API key
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Hook generador de Anthropic (batch)
  const { generateBatch, isGenerating, progress, results, error: genError, setError, clearResults } = useDocGenerator();

  // ─── Reset completo ─────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setCfdis([]);
    setFolios([]);
    setSelectedFolios([]);
    setExcelFileName("");
    setSelectedDocTypes([]);
    setRubro("");
    setInstrExtra("");
    clearResults();
  };

  // ─── Reset solo documento (mismo folio) ────────────────────────────────
  const handleNewDoc = () => {
    setSelectedDocTypes([]);
    setRubro("");
    setInstrExtra("");
    clearResults();
    setStep(3);
  };

  // ─── Parseo Excel de control ────────────────────────────────────────────
  const handleExcelFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      setError("Por favor selecciona un archivo .xlsx de Excel de control.");
      return;
    }
    setExcelParsing(true);
    setError("");
    try {
      const parsed = await parseExcelControl(file);
      setFolios(parsed);
      setSelectedFolios([]);
      setExcelFileName(file.name);
      setStep(2);
    } catch (err) {
      setError(`Error al parsear Excel: ${err.message}`);
    } finally {
      setExcelParsing(false);
    }
  };

  // ─── Selección múltiple de folios ────────────────────────────────────────
  const handleFolioSelect = (folio) => {
    setSelectedFolios((prev) => {
      const isSelected = prev.some((f) => f.folio === folio.folio);
      if (isSelected) {
        return prev.filter((f) => f.folio !== folio.folio);
      } else {
        return [...prev, folio];
      }
    });
  };

  // ─── Seleccionar/Deseleccionar todos los folios ──────────────────────────
  const handleToggleAllFolios = () => {
    if (selectedFolios.length === folios.length) {
      setSelectedFolios([]);
    } else {
      setSelectedFolios(folios);
    }
  };

  // ─── Avance a Paso 3 con múltiples CFDIs ──────────────────────────────
  const handleFolioContinue = () => {
    if (selectedFolios.length === 0) return;
    const mappedCfdis = selectedFolios.map((folio) => folioToCfdi(folio));
    setCfdis(mappedCfdis);
    setStep(3);
  };

  // ─── Generación batch de documentos (múltiples CFDIs) ────────────────────
  const handleGenerate = async (docTypeIds) => {
    setSelectedDocTypes(docTypeIds);
    setStep(4);
    await generateBatch(cfdis, docTypeIds, rubro, instrExtra);
  };

  return (
    <>
      <Header onOpenApiKey={() => setIsApiKeyModalOpen(true)} />

      <main className="app-container" style={{ flex: 1, marginTop: "1rem" }}>
        <StepIndicator current={step} />

        <ErrorBanner message={genError} onDismiss={() => setError("")} />

        {/* ── PASO 1: Carga de Excel ──────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-slideUp">
            <UploadZone
              accept=".xlsx,.xls"
              onFile={handleExcelFile}
              icon={excelParsing ? "ti-loader-2" : "ti-table-filled"}
              iconColor="var(--accent-success-light)"
              title={excelParsing ? "Procesando Excel..." : "Arrastra el Excel de control aquí"}
              subtitle={
                excelParsing
                  ? "Analizando folios y productos..."
                  : "o haz clic para seleccionar el archivo .xlsx"
              }
              badge="Formato: FOLIO · Fechas · Desc1-6 · Cant1-6 · ValorU1-6"
              badgeIcon="ti-info-circle"
              disabled={excelParsing}
              hint={
                excelParsing ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <i className="ti ti-loader-2" style={{ animation: "spin 0.8s linear infinite", marginRight: 4 }} />
                    Leyendo hojas del Excel...
                  </span>
                ) : null
              }
            />
          </div>
        )}

        {/* ── PASO 2: Selección múltiple de folios ────────────────────── */}
        {step === 2 && folios.length > 0 && (
          <div className="animate-slideUp">
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i
                  className="ti ti-circle-check"
                  style={{ color: "var(--accent-success-light)", fontSize: "16px" }}
                  aria-hidden="true"
                />
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {folios.length} folio{folios.length !== 1 ? "s" : ""} encontrado{folios.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    padding: "1px 8px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {excelFileName}
                </span>
              </div>
              <button
                onClick={handleToggleAllFolios}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor:
                    selectedFolios.length === folios.length
                      ? "var(--accent-primary)"
                      : "var(--bg-surface)",
                  color:
                    selectedFolios.length === folios.length
                      ? "white"
                      : "var(--text-primary)",
                  border: `1px solid ${
                    selectedFolios.length === folios.length
                      ? "var(--accent-primary)"
                      : "var(--border-subtle)"
                  }`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {selectedFolios.length === folios.length
                  ? "✓ Deseleccionar todo"
                  : "Seleccionar todo"}
              </button>
            </div>

            {/* Tarjetas de folios (multi-select) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {folios.map((folio) => (
                <FolioCard
                  key={folio.folio}
                  folio={folio}
                  selected={selectedFolios.some((f) => f.folio === folio.folio)}
                  onSelect={() => handleFolioSelect(folio)}
                />
              ))}
            </div>

            {/* Resumen de selección */}
            {selectedFolios.length > 0 && (
              <div
                style={{
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "var(--accent-success-light)",
                }}
              >
                ✓ {selectedFolios.length} folio{selectedFolios.length !== 1 ? "s" : ""} seleccionado{selectedFolios.length !== 1 ? "s" : ""}:{" "}
                {selectedFolios.map((f) => f.folio).join(", ")}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.9rem", fontWeight: 600 }}
              >
                <i className="ti ti-arrow-left" aria-hidden="true" />
                Cargar otro Excel
              </button>
              <button
                onClick={handleFolioContinue}
                disabled={selectedFolios.length === 0}
                className="btn-primary"
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.9rem", fontWeight: 600 }}
              >
                <i className="ti ti-arrow-right" aria-hidden="true" />
                Continuar con {selectedFolios.length} folio{selectedFolios.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Configurar documentos (multi-select) ───────────────── */}
        {step === 3 && cfdis.length > 0 && (
          <div>
            {/* Resumen de folios */}
            <div
              style={{
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              📋 Folios a procesar: <strong>{cfdis.length}</strong> —{" "}
              {selectedFolios.map((f) => f.folio).join(", ")}
            </div>

            <DocConfig
              cfdi={cfdis[0]}
              selectedDocTypes={selectedDocTypes}
              setSelectedDocTypes={setSelectedDocTypes}
              rubro={rubro}
              setRubro={setRubro}
              instrExtra={instrExtra}
              setInstrExtra={setInstrExtra}
              isDisabled={isGenerating}
              onBack={() => setStep(2)}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* ── PASO 4: Resultado + Exportación (batch) ───────────────────── */}
        {step === 4 && cfdis.length > 0 && (
          <DocResult
            cfdis={cfdis}
            selectedFolios={selectedFolios}
            rubro={rubro}
            isGenerating={isGenerating}
            progress={progress}
            results={results}
            onReset={handleReset}
            onNewDoc={handleNewDoc}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.5rem",
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <img
          src="/logo-miniatura.jpg"
          alt="Itosturre Logo"
          style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
        />
        <span>Sistema Itosturre · Legaltech B2B · {new Date().getFullYear()}</span>
      </footer>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </>
  );
}
