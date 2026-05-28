/**
 * demoMode.js — Helper para detectar si el modo DEMO está activo.
 *
 * Prioridad de lectura:
 *   1. localStorage["cfdi_demo_mode"] (override dev — no requiere rebuild)
 *   2. import.meta.env.VITE_DEMO_MODE (valor del .env)
 *   3. "true" por defecto (DEMO siempre activo si no hay config)
 *
 * Para activar producción en dev sin rebuild:
 *   localStorage.setItem("cfdi_demo_mode", "false")
 *   localStorage.removeItem("cfdi_demo_mode")  ← restaura valor del .env
 */
export function isDemoMode() {
  // Override dev en localStorage
  const lsOverride = localStorage.getItem("cfdi_demo_mode");
  if (lsOverride !== null) {
    return lsOverride !== "false";
  }
  // Variable de entorno de Vite
  const envVal = import.meta.env.VITE_DEMO_MODE;
  // Si no está definida o está vacía → DEMO activo por defecto
  if (!envVal || envVal === "") return true;
  return envVal !== "false";
}

/**
 * Prefijo para nombres de archivo según modo.
 * DEMO: "DEMO_" | Producción: ""
 */
export function demoPrefix() {
  return isDemoMode() ? "DEMO_" : "";
}

/**
 * Prefijo para carpeta de Drive según modo.
 * DEMO: "CFDI-GEN DEMO" | Producción: "CFDI-GEN"
 */
export function driveFolderRoot() {
  return isDemoMode() ? "CFDI-GEN DEMO" : "CFDI-GEN";
}
