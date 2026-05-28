import { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import StepIndicator from "./components/StepIndicator";
import UploadZone from "./components/UploadZone";
import FolioCard from "./components/FolioCard";
import CFDIReview from "./components/CFDIReview";
import DocConfig from "./components/DocConfig";
import DocResult from "./components/DocResult";
import ApiKeyModal from "./components/ApiKeyModal";
import ErrorBanner from "./components/ErrorBanner";
import { parseExcelControl, folioToCfdi } from "./utils/parseExcelControl";
import { parseCFDI } from "./utils/parseCFDI";
import { useDocGenerator } from "./hooks/useDocGenerator";
import { logEvent } from "./utils/auditLog";

// ─── Auth gate ───────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("cfdi_auth") === "true");
  const [authUser, setAuthUser] = useState(() => sessionStorage.getItem("cfdi_user") || "");

  const handleLogin = (user) => {
    setAuthUser(user);
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;
  return <AppContent user={authUser} onLogout={handleLogout} />;
}

const SESSION_TIMEOUT = 30 * 60 * 1000;

// ─── App principal ───────────────────────────────────────────────────────────
function AppContent({ user, onLogout }) {
  // Modo de entrada
  const [inputMode, setInputMode] = useState("excel"); // "excel" | "xml"

  // Estado del flujo
  const [step, setStep] = useState(1);

  // Excel
  const [folios, setFolios] = useState([]);
  const [selectedFolios, setSelectedFolios] = useState([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelParsing, setExcelParsing] = useState(false);

  // XML
  const [xmlFileName, setXmlFileName] = useState("");
  const [xmlParsing, setXmlParsing] = useState(false);

  // CFDIs de los folios seleccionados (Excel) o del XML parseado
  const [cfdis, setCfdis] = useState([]);

  // Config del documento (batch)
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [rubro, setRubro] = useState("");
  const [instrExtra, setInstrExtra] = useState("");

  // Modal API key
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const { generateBatch, isGenerating, progress, results, error: genError, setError, clearResults, rateLimitedUntil } = useDocGenerator();

  // ─── Timeout de sesión por inactividad (30 min) ──────────────────────────

  const updateActivity = useCallback(() => {
    sessionStorage.setItem("cfdi_last_activity", String(Date.now()));
  }, []);

  useEffect(() => {
    sessionStorage.setItem("cfdi_last_activity", String(Date.now()));
    const events = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach((ev) => document.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const last = parseInt(sessionStorage.getItem("cfdi_last_activity") || "0");
      if (Date.now() - last > SESSION_TIMEOUT) {
        logEvent("SESSION_EXPIRADA", "Inactividad de 30 minutos");
        sessionStorage.clear();
        window.alert("Sesión expirada por inactividad.");
        window.location.reload();
      }
    }, 60 * 1000);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [updateActivity]);

  // ─── Reset completo ─────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setCfdis([]);
    setFolios([]);
    setSelectedFolios([]);
    setExcelFileName("");
    setXmlFileName("");
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

  // ─── Cambio de modo en Paso 1 ────────────────────────────────────────────
  const handleModeChange = (mode) => {
    setInputMode(mode);
    setError("");
  };

  // ─── Parseo Excel de control ────────────────────────────────────────────
  const handleExcelFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      setError("Por favor selecciona un archivo .xlsx de Excel de control.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo Excel es demasiado grande (máximo 5MB).");
      return;
    }
    setExcelParsing(true);
    setError("");
    try {
      const parsed = await parseExcelControl(file);
      setFolios(parsed);
      setSelectedFolios([]);
      setExcelFileName(file.name);
      logEvent("ARCHIVO_CARGADO", `Excel: ${file.name} — ${parsed.length} folios`);
      setStep(2);
    } catch (err) {
      setError(`Error al parsear Excel: ${err.message}`);
    } finally {
      setExcelParsing(false);
    }
  };

  // ─── Parseo XML CFDI ─────────────────────────────────────────────────────
  const handleXmlFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.xml$/i)) {
      setError("Por favor selecciona un archivo .xml de CFDI.");
      return;
    }
    setXmlParsing(true);
    setError("");
    try {
      const text = await file.text();
      const cfdi = parseCFDI(text);
      setCfdis([cfdi]);
      setXmlFileName(file.name);
      logEvent("ARCHIVO_CARGADO", `XML: ${file.name}`);
      setStep(2);
    } catch (err) {
      setError(`Error al parsear CFDI: ${err.message}`);
    } finally {
      setXmlParsing(false);
    }
  };

  // ─── Selección múltiple de folios (Excel) ────────────────────────────────
  const handleFolioSelect = useCallback((folio) => {
    setSelectedFolios((prev) => {
      const isSelected = prev.some((f) => f.folio === folio.folio);
      if (isSelected) {
        return prev.filter((f) => f.folio !== folio.folio);
      } else {
        return [...prev, folio];
      }
    });
  }, []);

  const handleToggleAllFolios = () => {
    if (selectedFolios.length === folios.length) {
      setSelectedFolios([]);
    } else {
      setSelectedFolios(folios);
    }
  };

  // ─── Avance a Paso 3 desde Excel ──────────────────────────────────────────
  const handleFolioContinue = () => {
    if (selectedFolios.length === 0) return;
    const mappedCfdis = selectedFolios.map((folio) => folioToCfdi(folio));
    setCfdis(mappedCfdis);
    setStep(3);
  };

  // ─── Generación batch ────────────────────────────────────────────────────
  const handleGenerate = async (docTypeIds) => {
    setSelectedDocTypes(docTypeIds);
    setStep(4);
    await generateBatch(cfdis, docTypeIds, rubro, instrExtra);
  };

  return (
    <>
      <Header onOpenApiKey={() => setIsApiKeyModalOpen(true)} user={user} onLogout={onLogout} />

      <main className="app-container" style={{ flex: 1, marginTop: "1rem" }}>
        <StepIndicator current={step} />

        <ErrorBanner message={genError} onDismiss={() => setError("")} />

        {/* ── PASO 1: Selector de modo + Upload ──────────────────────────── */}
        {step === 1 && (
          <div className="animate-slideUp">
            {/* Toggle Excel / XML */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.25rem",
              }}
            >
              {[
                { id: "excel", icon: "ti-table-filled", label: "Excel de control", color: "var(--accent-success-light)" },
                // { id: "xml", icon: "ti-file-type-xml", label: "CFDI (.xml)", color: "var(--accent-primary-light)" },
              ].map(({ id, icon, label, color }) => (
                <button
                  key={id}
                  onClick={() => handleModeChange(id)}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8125rem",
                    fontWeight: inputMode === id ? 600 : 400,
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: inputMode === id ? "var(--bg-elevated)" : "transparent",
                    color: inputMode === id ? color : "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.375rem",
                    boxShadow: inputMode === id ? "var(--shadow-sm)" : "none",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <i className={`ti ${icon}`} style={{ fontSize: "15px" }} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Upload zone Excel */}
            {inputMode === "excel" && (
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
            )}

            {/* Upload zone XML */}
            {inputMode === "xml" && (
              <UploadZone
                accept=".xml"
                onFile={handleXmlFile}
                icon={xmlParsing ? "ti-loader-2" : "ti-file-type-xml"}
                iconColor="var(--accent-primary-light)"
                title={xmlParsing ? "Parseando CFDI..." : "Arrastra el CFDI (.xml) aquí"}
                subtitle={
                  xmlParsing
                    ? "Extrayendo datos fiscales..."
                    : "o haz clic para seleccionar el archivo .xml"
                }
                badge="Compatible con CFDI 3.3 y 4.0 — SAT México"
                badgeIcon="ti-shield-check"
                disabled={xmlParsing}
                hint={
                  xmlParsing ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <i className="ti ti-loader-2" style={{ animation: "spin 0.8s linear infinite", marginRight: 4 }} />
                      Procesando XML...
                    </span>
                  ) : null
                }
              />
            )}
          </div>
        )}

        {/* ── PASO 2a: Revisión CFDI XML ──────────────────────────────────── */}
        {step === 2 && inputMode === "xml" && cfdis.length > 0 && (
          <CFDIReview
            cfdi={cfdis[0]}
            fileName={xmlFileName}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* ── PASO 2b: Selección múltiple de folios Excel ─────────────────── */}
        {step === 2 && inputMode === "excel" && folios.length > 0 && (
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

            {/* Tarjetas de folios */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {folios.map((folio) => (
                <FolioCard
                  key={folio.folio}
                  folio={folio}
                  selected={selectedFolios.some((f) => f.folio === folio.folio)}
                  onSelect={handleFolioSelect}
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

        {/* ── PASO 3: Configurar documentos ───────────────────────────────── */}
        {step === 3 && cfdis.length > 0 && (
          <div>
            {/* Resumen de origen */}
            <div
              style={{
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i
                className={`ti ${inputMode === "xml" ? "ti-file-type-xml" : "ti-table-filled"}`}
                style={{ fontSize: "15px", flexShrink: 0 }}
                aria-hidden="true"
              />
              {inputMode === "xml" ? (
                <>CFDI XML: <strong>{xmlFileName}</strong> — RFC {cfdis[0].emisor.rfc}</>
              ) : (
                <>Folios a procesar: <strong>{cfdis.length}</strong> — {selectedFolios.map((f) => f.folio).join(", ")}</>
              )}
            </div>

            <DocConfig
              cfdi={cfdis[0]}
              selectedDocTypes={selectedDocTypes}
              setSelectedDocTypes={setSelectedDocTypes}
              rubro={rubro}
              setRubro={setRubro}
              instrExtra={instrExtra}
              setInstrExtra={setInstrExtra}
              isDisabled={isGenerating || Date.now() < rateLimitedUntil}
              onBack={() => setStep(2)}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* ── PASO 4: Resultado + Exportación ─────────────────────────────── */}
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
