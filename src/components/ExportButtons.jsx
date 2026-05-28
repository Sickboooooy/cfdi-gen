import { useState } from "react";
import { saveAs } from "file-saver";
import { generateExpedienteDocx } from "../utils/generateDocx";
import { demoPrefix } from "../utils/demoMode";

/**
 * ExportButtons — Botón único para descargar Word batch
 * Filtra resultados sin error y genera un Word con todos los documentos de todos los folios
 */
export default function ExportButtons({ cfdis, results, disabled }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadWord = async () => {
    if (!cfdis || !Array.isArray(cfdis) || cfdis.length === 0 || !results || results.length === 0) return;

    setDownloading(true);
    try {
      // Filtrar solo resultados exitosos (sin error)
      const successResults = results.filter((r) => !r.error);
      if (successResults.length === 0) {
        alert("No hay documentos generados exitosamente para descargar.");
        setDownloading(false);
        return;
      }

      // Transformar resultados al formato que generateExpedienteDocx espera
      // Incluir información del folio en el label
      const aiSections = successResults.map((r) => ({
        label: `${r.folio ? `[${r.folio}] ` : ""}${r.label}`,
        content: r.content,
      }));

      // Usar el primer CFDI como referencia principal (para portada y estructura)
      const primaryCfdi = cfdis[0];

      // Generar Word con todos los documentos
      const blob = await generateExpedienteDocx(primaryCfdi, aiSections);

      // Crear nombre de archivo
      const prefix = demoPrefix();
      const folioIds = cfdis.map((c) => c._folioControl || c.folio || "SIN-FOLIO").join("-");
      const fileName = `${prefix}${folioIds}_Expediente_Completo_${cfdis.length}Folios.docx`;

      // Descargar
      saveAs(blob, fileName);
    } catch (err) {
      console.error("[ExportButtons] Error al descargar Word:", err);
      alert(`Error al generar el Word: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const successCount = results.filter((r) => !r.error).length;

  return (
    <button
      onClick={handleDownloadWord}
      disabled={disabled || downloading || successCount === 0}
      className="btn-primary"
      style={{
        width: "100%",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
      }}
    >
      {downloading ? (
        <>
          <i
            className="ti ti-loader-2"
            style={{ animation: "spin 0.8s linear infinite", fontSize: "20px" }}
            aria-hidden="true"
          />
          Preparando Word...
        </>
      ) : (
        <>
          <i className="ti ti-download" style={{ fontSize: "20px" }} aria-hidden="true" />
          ⬇️ Descargar Word ({successCount} documento{successCount !== 1 ? "s" : ""})
        </>
      )}
    </button>
  );
}
