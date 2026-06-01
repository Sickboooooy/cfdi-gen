import { useEffect } from "react";

const STORAGE_KEY = "cfdi_fiscal_config";

const REGIMENES = [
  { value: "", label: "— Régimen fiscal —" },
  { value: "601", label: "601 – General de Ley Personas Morales" },
  { value: "603", label: "603 – PM sin fines lucrativos" },
  { value: "605", label: "605 – Sueldos y Salarios" },
  { value: "606", label: "606 – Arrendamiento" },
  { value: "608", label: "608 – Demás ingresos" },
  { value: "612", label: "612 – PF Actividades Empresariales" },
  { value: "616", label: "616 – Sin obligaciones fiscales" },
  { value: "621", label: "621 – Incorporación Fiscal" },
  { value: "625", label: "625 – Coordinados" },
  { value: "626", label: "626 – RESICO" },
];

const USOS_CFDI = [
  { value: "", label: "— Uso CFDI —" },
  { value: "G01", label: "G01 – Adquisición de mercancias" },
  { value: "G02", label: "G02 – Devoluciones / descuentos" },
  { value: "G03", label: "G03 – Gastos en general" },
  { value: "I01", label: "I01 – Construcciones" },
  { value: "I02", label: "I02 – Mobiliario y equipo de oficina" },
  { value: "I03", label: "I03 – Equipo de transporte" },
  { value: "I04", label: "I04 – Equipo de cómputo" },
  { value: "I06", label: "I06 – Comunicaciones telefónicas" },
  { value: "I08", label: "I08 – Maquinaria y equipo" },
  { value: "P01", label: "P01 – Por definir" },
  { value: "S01", label: "S01 – Sin efectos fiscales" },
  { value: "CP01", label: "CP01 – Pagos" },
  { value: "CN01", label: "CN01 – Nómina" },
];

export function emptyFiscalConfig() {
  return {
    emisorRfc: "",
    emisorNombre: "",
    emisorRegimen: "",
    emisorCP: "",
    receptorRfc: "",
    receptorNombre: "",
    receptorUsoCFDI: "",
    receptorCP: "",
  };
}

const labelStyle = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: "0.25rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const monoInput = { fontFamily: "var(--font-mono)", fontSize: "0.8125rem" };

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  marginBottom: "0.75rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid var(--border-subtle)",
};

export default function FiscalConfig({ value, onChange }) {
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
  }, [value]);

  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  const toUpper = (field) => (e) => {
    e.target.value = e.target.value.toUpperCase();
    onChange({ ...value, [field]: e.target.value });
  };

  const handleClear = () => {
    onChange(emptyFiscalConfig());
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
  };

  const hasData = value.emisorRfc || value.receptorRfc;

  return (
    <div className="glass-card-strong" style={{ padding: "1rem", marginBottom: "1rem" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className="ti ti-building-community" style={{ fontSize: "16px", color: "var(--accent-primary-light)" }} aria-hidden="true" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Partes de la Operación</span>
          {hasData && (
            <span style={{
              fontSize: "0.6875rem", padding: "1px 8px",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "var(--radius-sm)", color: "var(--accent-success-light)",
            }}>
              Configurado
            </span>
          )}
        </div>
        {hasData && (
          <button
            onClick={handleClear}
            style={{
              fontSize: "0.6875rem", padding: "0.2rem 0.6rem",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)", color: "var(--accent-danger-light)", cursor: "pointer",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "11px", marginRight: "3px" }} aria-hidden="true" />
            Limpiar
          </button>
        )}
      </div>

      {/* Grid Emisor | Receptor */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>

        {/* EMISOR */}
        <div>
          <div style={sectionHeader}>
            <i className="ti ti-arrow-up-circle" style={{ fontSize: "14px", color: "var(--accent-primary-light)" }} aria-hidden="true" />
            Emisor
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div>
              <label style={labelStyle}>RFC</label>
              <input
                type="text" value={value.emisorRfc}
                onChange={toUpper("emisorRfc")}
                placeholder="Ej: AAA010101AAA"
                maxLength={13} style={monoInput}
              />
            </div>
            <div>
              <label style={labelStyle}>Razón Social / Nombre</label>
              <input
                type="text" value={value.emisorNombre}
                onChange={set("emisorNombre")}
                placeholder="Nombre o razón social del emisor"
                style={{ fontSize: "0.8125rem" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Régimen Fiscal</label>
              <select value={value.emisorRegimen} onChange={set("emisorRegimen")} style={{ fontSize: "0.8125rem" }}>
                {REGIMENES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>C.P. Lugar de Expedición</label>
              <input
                type="text" value={value.emisorCP}
                onChange={set("emisorCP")}
                placeholder="Ej: 44700"
                maxLength={5} style={monoInput}
              />
            </div>
          </div>
        </div>

        {/* RECEPTOR */}
        <div>
          <div style={sectionHeader}>
            <i className="ti ti-arrow-down-circle" style={{ fontSize: "14px", color: "var(--accent-warning-light)" }} aria-hidden="true" />
            Receptor
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div>
              <label style={labelStyle}>RFC</label>
              <input
                type="text" value={value.receptorRfc}
                onChange={toUpper("receptorRfc")}
                placeholder="Ej: BBB020202BBB"
                maxLength={13} style={monoInput}
              />
            </div>
            <div>
              <label style={labelStyle}>Razón Social / Nombre</label>
              <input
                type="text" value={value.receptorNombre}
                onChange={set("receptorNombre")}
                placeholder="Nombre o razón social del receptor"
                style={{ fontSize: "0.8125rem" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Uso CFDI</label>
              <select value={value.receptorUsoCFDI} onChange={set("receptorUsoCFDI")} style={{ fontSize: "0.8125rem" }}>
                {USOS_CFDI.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>C.P. Domicilio Fiscal</label>
              <input
                type="text" value={value.receptorCP}
                onChange={set("receptorCP")}
                placeholder="Ej: 45645"
                maxLength={5} style={monoInput}
              />
            </div>
          </div>
        </div>
      </div>

      <p style={{ marginTop: "0.75rem", fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
        <i className="ti ti-info-circle" style={{ fontSize: "11px", marginRight: "4px" }} aria-hidden="true" />
        Los datos se conservan durante la sesión. Campos vacíos aparecerán como referencia pendiente en los documentos.
      </p>
    </div>
  );
}
