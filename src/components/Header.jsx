import { useState } from "react";

/**
 * Header — Branding Itosturre con badge DEMO y acceso a API key config
 */
export default function Header({ onOpenApiKey }) {
  return (
    <header
      style={{
        padding: "1rem 0",
        marginBottom: "1rem",
        background: "#062241",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem" }}>
        {/* Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="white" />
            <circle cx="56" cy="42" r="18" stroke="#062241" strokeWidth="8" />
            <line x1="43" y1="55" x2="26" y2="72" stroke="#062241" strokeWidth="12" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ 
                fontSize: "2rem", 
                fontWeight: 800, 
                letterSpacing: "0.02em", 
                lineHeight: 1,
                color: "white",
                margin: 0,
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}>
                AVANZZA
              </h1>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                DEMO
              </span>
            </div>
            <p style={{ 
              fontSize: "0.875rem", 
              color: "rgba(255, 255, 255, 0.9)", 
              lineHeight: 1.2,
              fontWeight: 500,
              marginTop: "0.15rem",
              letterSpacing: "0.01em"
            }}>
              Consultores Fiscales
            </p>
          </div>
        </div>

        {/* API Key button */}
        <button
          onClick={onOpenApiKey}
          title="Configurar API Key de Anthropic"
          style={{
            padding: "0.5rem",
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <i className="ti ti-key" style={{ fontSize: "18px" }} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
