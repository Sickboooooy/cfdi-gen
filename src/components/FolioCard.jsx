/**
 * FolioCard — Tarjeta seleccionable que representa un folio del Excel de control.
 *
 * Props:
 *   folio     {Object}   — objeto Folio parseado
 *   selected  {boolean}  — si está seleccionado
 *   onSelect  {Function} — callback(folio) al hacer clic
 */

import { memo } from "react";

const MXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function FolioCard({ folio, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(folio)}
      aria-pressed={selected}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1rem 1.125rem",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
        background: selected
          ? "rgba(99, 102, 241, 0.1)"
          : "var(--bg-surface)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        boxShadow: selected ? "0 0 0 1px rgba(99, 102, 241, 0.2), var(--shadow-glow)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
      onMouseOver={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.background = "var(--bg-hover)";
        }
      }}
      onMouseOut={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.background = "var(--bg-surface)";
        }
      }}
    >
      {/* Indicador seleccionado */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-strong)"}`,
          background: selected ? "var(--accent-primary)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--transition-fast)",
        }}
      >
        {selected && (
          <i className="ti ti-check" style={{ fontSize: "10px", color: "white" }} aria-hidden="true" />
        )}
      </div>

      {/* Folio principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span
            className="mono"
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: selected ? "var(--accent-primary-light)" : "var(--text-primary)",
              transition: "color var(--transition-fast)",
            }}
          >
            {folio.folio}
          </span>
          <span
            style={{
              fontSize: "0.625rem",
              padding: "1px 6px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.12)",
              color: "var(--accent-success-light)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              fontWeight: 600,
            }}
          >
            {folio.prods.length} producto{folio.prods.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Fechas */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            ["Sol.", folio.f_sol],
            ["Cot.", folio.f_cot],
            ["Ace.", folio.f_ace],
            ["Rec.", folio.f_rec],
          ].map(([label, val]) =>
            val ? (
              <span key={label} style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>
                <span style={{ color: "var(--text-muted)" }}>{label} </span>
                {val}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Total */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--accent-success-light)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {MXN.format(folio.total)}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          IVA: {MXN.format(folio.iva)}
        </div>
      </div>
    </button>
  );
}

export default memo(FolioCard);
