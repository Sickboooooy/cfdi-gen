import { useState } from "react";
import { saveAs } from "file-saver";
import { generateExpedienteDocx, validateCfdiPartes } from "../utils/generateDocx";
import { generateExpedienteXlsx } from "../utils/generateXlsx";
import { demoPrefix } from "../utils/demoMode";
import { findFrontingByRfc, FRONTINGS } from "../utils/avanzza/companiesDB";
import { isDriveConfigured, archiveDocumentsToDrive } from "../utils/googleDrive";

/**
 * ExportButtons — Descarga Word (.docx) y Excel (.xlsx) del expediente batch.
 * Word: un único archivo con todos los documentos de todos los folios.
 * Excel: un archivo por folio (con los documentos de ese folio como hoja 3).
 */
export default function ExportButtons({ cfdis, results, rubro, disabled, selectedCompany }) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [manualCompanyId, setManualCompanyId] = useState("");
  const [exportError, setExportError] = useState("");
  const [drive, setDrive] = useState({ phase: "idle", progress: "", uploaded: [], folderPath: "", folderLink: "", error: "" });

  const successResults = results.filter((r) => !r.error);
  const successCount = successResults.length;

  // Empresa detectada: prop > RFC auto-detect > selector manual en este paso
  const autoCompany =
    selectedCompany ||
    findFrontingByRfc(cfdis?.[0]?.receptor?.rfc) ||
    null;
  const detectedCompany =
    autoCompany ||
    (manualCompanyId ? FRONTINGS.find((f) => f.id === manualCompanyId) : null);

  // ── Word: un archivo combinado ────────────────────────────────────────────
  const handleDownloadDocx = async () => {
    if (!cfdis?.length || !successCount) return;

    const validation = validateCfdiPartes(cfdis);
    if (!validation.valid) {
      setExportError(validation.errors.join(" · "));
      return;
    }
    setExportError("");

    setDownloadingDocx(true);
    try {
      const aiSections = successResults.map((r) => ({
        label: `${r.folio ? `[${r.folio}] ` : ""}${r.label}`,
        content: r.content,
        docTypeId: r.docTypeId,
        folioIdx: r.folioIdx ?? 0,
      }));
      const companyId = detectedCompany?.id || null;

      const blob = await generateExpedienteDocx(cfdis, aiSections, {
        receptorCompanyId: companyId,
        emisorCompanyId: null,
      });
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

  const handleArchiveDrive = async () => {
    if (!isDriveConfigured()) {
      setDrive({ phase: "not_configured", progress: "", uploaded: [], folderPath: "", folderLink: "", error: "" });
      return;
    }
    setDrive({ phase: "loading", progress: "Iniciando...", uploaded: [], folderPath: "", folderLink: "", error: "" });
    try {
      const res = await archiveDocumentsToDrive({
        results: successResults,
        cfdis,
        onProgress: (msg) => setDrive((prev) => ({ ...prev, progress: msg })),
      });
      if (res.error === "auth_cancelled") {
        setDrive({ phase: "idle", progress: "", uploaded: [], folderPath: "", folderLink: "", error: "" });
        return;
      }
      if (res.error) {
        setDrive({ phase: "error", progress: "", uploaded: [], folderPath: "", folderLink: "", error: res.error });
        return;
      }
      setDrive({ phase: "success", progress: "", uploaded: res.uploaded, folderPath: res.folderPath, folderLink: res.folderLink, error: "" });
    } catch (err) {
      setDrive({ phase: "error", progress: "", uploaded: [], folderPath: "", folderLink: "", error: err.message });
    }
  };

  return (
    <div>
      {/* Indicador de empresa / membretado — o selector rápido si no se detectó */}
      {detectedCompany ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem",
          padding: "0.45rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem",
          background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
          color: "var(--accent-success-light)",
        }}>
          <i className="ti ti-photo-check" style={{ fontSize: "14px" }} aria-hidden="true" />
          Membretado: <strong style={{ marginLeft: "0.2rem" }}>{detectedCompany.nombre.split(",")[0]}</strong>
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem",
          padding: "0.45rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem",
          background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
          color: "var(--accent-warning-light)", flexWrap: "wrap",
        }}>
          <i className="ti ti-photo-off" style={{ fontSize: "14px", flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flexShrink: 0 }}>Empresa fronting:</span>
          <select
            value={manualCompanyId}
            onChange={(e) => setManualCompanyId(e.target.value)}
            style={{
              flex: 1, minWidth: "160px", fontSize: "0.75rem", padding: "0.15rem 0.4rem",
              borderRadius: "4px", border: "1px solid rgba(245,158,11,0.4)",
              background: "var(--bg-elevated)", color: "var(--text-primary)", cursor: "pointer",
            }}
          >
            <option value="">— Seleccionar para membretado —</option>
            {FRONTINGS.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre.split(",")[0]}</option>
            ))}
          </select>
        </div>
      )}

    {exportError && (
      <div style={{
        marginBottom: "0.75rem", padding: "0.6rem 0.875rem", borderRadius: "var(--radius-sm)",
        fontSize: "0.8rem", lineHeight: 1.5,
        background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
        color: "var(--accent-error, #f87171)",
      }}>
        <strong>No se puede generar el Word:</strong> {exportError}
      </div>
    )}

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

    {/* ── Archivar en Google Drive ── */}
    {successCount > 0 && (
      <div style={{ marginTop: "1rem" }}>

        {/* Idle — botón de acción */}
        {drive.phase === "idle" && (
          <button
            onClick={handleArchiveDrive}
            style={{
              width: "100%", padding: "0.6rem 1rem", fontSize: "0.875rem", fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.25)",
              borderRadius: "var(--radius-md)", color: "#7baaf7", cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(66,133,244,0.14)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(66,133,244,0.08)"}
          >
            <i className="ti ti-brand-google-drive" style={{ fontSize: "16px" }} aria-hidden="true" />
            Archivar documentos en Google Drive
          </button>
        )}

        {/* Not configured — instrucciones de conexión */}
        {drive.phase === "not_configured" && (
          <div style={{
            padding: "1rem 1.1rem", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", lineHeight: 1.6,
            background: "rgba(66,133,244,0.07)", border: "1px solid rgba(66,133,244,0.22)", color: "var(--text-secondary)",
          }}>
            <div style={{ fontWeight: 600, color: "#7baaf7", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <i className="ti ti-folder-open" style={{ fontSize: "15px" }} aria-hidden="true" />
              Conectar Google Drive
            </div>
            Para guardar documentos automáticamente necesito acceso a tu Google Drive.<br />
            Agrega <code style={{ background: "rgba(66,133,244,0.12)", padding: "1px 5px", borderRadius: 3 }}>VITE_GOOGLE_CLIENT_ID</code> en tu <code style={{ background: "rgba(66,133,244,0.12)", padding: "1px 5px", borderRadius: 3 }}>.env</code> y reinicia el servidor.
            <div style={{ marginTop: "0.625rem" }}>
              <button onClick={() => setDrive((p) => ({ ...p, phase: "idle" }))}
                style={{ fontSize: "0.75rem", color: "#7baaf7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Loading — progreso */}
        {drive.phase === "loading" && (
          <div style={{
            padding: "0.7rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.8125rem",
            background: "rgba(66,133,244,0.07)", border: "1px solid rgba(66,133,244,0.22)",
            color: "#7baaf7", display: "flex", alignItems: "center", gap: "0.6rem",
          }}>
            <i className="ti ti-loader-2" style={{ fontSize: "15px", animation: "spin 0.8s linear infinite", flexShrink: 0 }} aria-hidden="true" />
            {drive.progress}
          </div>
        )}

        {/* Success — confirmación con ruta y enlace */}
        {drive.phase === "success" && (
          <div style={{
            padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", lineHeight: 1.7,
            background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", color: "var(--text-secondary)",
          }}>
            <div style={{ fontWeight: 600, color: "var(--accent-success-light)", marginBottom: "0.35rem" }}>
              ✅ {drive.uploaded.length} documento{drive.uploaded.length !== 1 ? "s" : ""} archivado{drive.uploaded.length !== 1 ? "s" : ""} correctamente
            </div>
            <div>📁 <strong>Carpeta:</strong> {drive.folderPath}</div>
            {drive.uploaded.slice(0, 3).map((u, i) => (
              <div key={i}>📄 {u.fileName}</div>
            ))}
            {drive.uploaded.length > 3 && <div style={{ color: "var(--text-muted)" }}>…y {drive.uploaded.length - 3} más</div>}
            <div style={{ marginTop: "0.4rem" }}>
              <a href={drive.folderLink} target="_blank" rel="noopener noreferrer"
                style={{ color: "#7baaf7", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                🔗 Ver carpeta en Drive →
              </a>
            </div>
            <button onClick={() => setDrive((p) => ({ ...p, phase: "idle" }))}
              style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Archivar de nuevo
            </button>
          </div>
        )}

        {/* Error — mensaje amigable sin stack traces */}
        {drive.phase === "error" && (
          <div style={{
            padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", lineHeight: 1.6,
            background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--text-secondary)",
          }}>
            <div style={{ fontWeight: 600, color: "var(--accent-warning-light)", marginBottom: "0.35rem" }}>
              ⚠️ No pude guardar en Drive en este momento.
            </div>
            Tu documento está listo arriba — puedes descargarlo manualmente.
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem" }}>
              <button onClick={handleArchiveDrive}
                style={{ fontSize: "0.8rem", color: "#7baaf7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Intentar de nuevo
              </button>
              <button onClick={() => setDrive((p) => ({ ...p, phase: "idle" }))}
                style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

      </div>
    )}
    </div>
  );
}
