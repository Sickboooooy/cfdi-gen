import { useState } from "react";
import { saveAs } from "file-saver";
import { generateExpedienteDocx } from "../utils/generateDocx";
import { generateExpedienteXlsx } from "../utils/generateXlsx";
import { demoPrefix } from "../utils/demoMode";

/**
 * ExportButtons — Descarga Word (.docx) y Excel (.xlsx) del expediente batch.
 * Word: un único archivo con todos los documentos de todos los folios.
 * Excel: un archivo por folio (con los documentos de ese folio como hoja 3).
 */
export default function ExportButtons({ cfdis, results, rubro, disabled }) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

  const successResults = results.filter((r) => !r.error);
  const successCount = successResults.length;

  // ── Word: un archivo combinado ────────────────────────────────────────────
  const handleDownloadDocx = async () => {
    if (!cfdis?.length || !successCount) return;
    setDownloadingDocx(true);
    try {
      const aiSections = successResults.map((r) => ({
        label: `${r.folio ? `[${r.folio}] ` : ""}${r.label}`,
        content: r.content,
      }));
      const blob = await generateExpedienteDocx(cfdis[0], aiSections);
      const prefix = demoPrefix();
      const folioIds = cfdis.map((c) => c._folioControl || c.folio || "SIN-FOLIO").join("-");
      saveAs(blob, `${prefix}${folioIds}_Expediente_Completo_${cfdis.length}Folios.docx`);
    } catch (err) {
      console.error("[ExportButtons] Error Word:", err);
      alert(`Error al generar Word: ${err.message}`);
    } finally {
      setDownloadingDocx(false);
    }
  };

  // ── Excel: un archivo por folio ───────────────────────────────────────────
  const handleDownloadXlsx = () => {
    if (!cfdis?.length || !successCount) return;
    setDownloadingXlsx(true);
    try {
      cfdis.forEach((cfdi, idx) => {
        const folioResults = successResults.filter((r) => r.folioIdx === idx);
        if (folioResults.length === 0) return;
        const firstDocTypeId = folioResults[0].docTypeId;
        const aiText = folioResults.map((r) => `=== ${r.label} ===\n${r.content}`).join("\n\n");
        generateExpedienteXlsx(cfdi, firstDocTypeId, rubro, aiText);
      });
    } catch (err) {
      console.error("[ExportButtons] Error Excel:", err);
      alert(`Error al generar Excel: ${err.message}`);
    } finally {
      setDownloadingXlsx(false);
    }
  };

  const isDisabled = disabled || successCount === 0;

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {/* ── Word ── */}
      <button
        onClick={handleDownloadDocx}
        disabled={isDisabled || downloadingDocx}
        className="btn-primary"
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "0.875rem 1rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
        }}
      >
        {downloadingDocx ? (
          <>
            <i className="ti ti-loader-2" style={{ animation: "spin 0.8s linear infinite", fontSize: "18px" }} aria-hidden="true" />
            Preparando Word...
          </>
        ) : (
          <>
            <i className="ti ti-file-type-doc" style={{ fontSize: "18px" }} aria-hidden="true" />
            Descargar Word ({successCount} doc{successCount !== 1 ? "s" : ""})
          </>
        )}
      </button>

      {/* ── Excel ── */}
      <button
        onClick={handleDownloadXlsx}
        disabled={isDisabled || downloadingXlsx}
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "0.875rem 1rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "var(--radius-md)",
          color: "var(--accent-success-light)",
          cursor: isDisabled || downloadingXlsx ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          transition: "all var(--transition-fast)",
        }}
      >
        {downloadingXlsx ? (
          <>
            <i className="ti ti-loader-2" style={{ animation: "spin 0.8s linear infinite", fontSize: "18px" }} aria-hidden="true" />
            Preparando Excel...
          </>
        ) : (
          <>
            <i className="ti ti-file-type-xls" style={{ fontSize: "18px" }} aria-hidden="true" />
            Descargar Excel ({cfdis?.length ?? 0} folio{cfdis?.length !== 1 ? "s" : ""})
          </>
        )}
      </button>
    </div>
  );
}
