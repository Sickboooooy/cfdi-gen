import UploadZone from "./UploadZone";

/**
 * FileUpload — Paso 1 (modo XML): Drop zone para cargar CFDI (.xml)
 * Refactorizado para usar el componente UploadZone genérico.
 */
export default function FileUpload({ onFileParsed }) {
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

  return (
    <div className="animate-slideUp">
      <UploadZone
        accept=".xml"
        onFile={handleFile}
        icon="ti-file-type-xml"
        iconColor="var(--accent-primary-light)"
        title="Arrastra tu CFDI aquí"
        subtitle="o haz clic para seleccionar un archivo .xml"
        badge="Compatible con CFDI 3.3 y 4.0"
        badgeIcon="ti-shield-check"
      />
    </div>
  );
}
