import { useState } from "react";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import CFDIReview from "./components/CFDIReview";
import DocConfig from "./components/DocConfig";
import DocResult from "./components/DocResult";
import ApiKeyModal from "./components/ApiKeyModal";
import ErrorBanner from "./components/ErrorBanner";
import { parseCFDI } from "./utils/parseCFDI";
import { useDocGenerator } from "./hooks/useDocGenerator";

export default function App() {
  const [step, setStep] = useState(1);
  const [cfdi, setCfdi] = useState(null);
  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState("");
  const [rubro, setRubro] = useState("");
  const [instrExtra, setInstrExtra] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Hook generador de Anthropic
  const { generate, generating, result, error: genError, setError, clearResult } = useDocGenerator();

  // Resetear todo
  const handleReset = () => {
    setStep(1);
    setCfdi(null);
    setFileName("");
    setDocType("");
    setRubro("");
    setInstrExtra("");
    clearResult();
  };

  // Resetear solo documento
  const handleNewDoc = () => {
    setDocType("");
    setRubro("");
    setInstrExtra("");
    clearResult();
    setStep(3);
  };

  // Parseo del XML
  const handleFileParsed = (xmlString, fName, errorMsg) => {
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    try {
      const parsed = parseCFDI(xmlString);
      setCfdi(parsed);
      setFileName(fName);
      setError("");
      setStep(2);
    } catch (err) {
      setError(`No se pudo leer el CFDI: ${err.message}`);
    }
  };

  // Generación
  const handleGenerate = async () => {
    const text = await generate(cfdi, docType, rubro, instrExtra);
    if (text) {
      setStep(4);
    }
  };

  return (
    <>
      <Header onOpenApiKey={() => setIsApiKeyModalOpen(true)} />

      <main className="app-container" style={{ flex: 1, marginTop: "1rem" }}>
        <StepIndicator current={step} />

        <ErrorBanner message={genError} onDismiss={() => setError("")} />

        {step === 1 && (
          <FileUpload onFileParsed={handleFileParsed} />
        )}

        {step === 2 && cfdi && (
          <CFDIReview
            cfdi={cfdi}
            fileName={fileName}
            onBack={handleReset}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && cfdi && (
          <DocConfig
            cfdi={cfdi}
            docType={docType}
            setDocType={setDocType}
            rubro={rubro}
            setRubro={setRubro}
            instrExtra={instrExtra}
            setInstrExtra={setInstrExtra}
            generating={generating}
            onBack={() => setStep(2)}
            onGenerate={handleGenerate}
          />
        )}

        {step === 4 && result && cfdi && (
          <DocResult
            cfdi={cfdi}
            docType={docType}
            rubro={rubro}
            result={result}
            onReset={handleReset}
            onNewDoc={handleNewDoc}
          />
        )}
      </main>

      {/* Footer minimalista */}
      <footer style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.75rem", color: "var(--text-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <img src="/logo-miniatura.jpg" alt="Itosturre Logo" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
        <span>Sistema Itosturre · Legaltech B2B · {new Date().getFullYear()}</span>
      </footer>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </>
  );
}
