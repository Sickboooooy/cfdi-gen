/**
 * Utilidades de formato — Sistema Itosturre
 */

/**
 * Formatea un valor numérico como moneda mexicana (MXN).
 * @param {string|number} val — valor a formatear
 * @returns {string} valor formateado con 2 decimales y separadores MX
 */
export function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n)
    ? val
    : n.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

/**
 * Formatea fecha ISO a formato legible mexicano.
 * @param {string} isoDate — fecha ISO (ej: "2025-05-15T10:30:00")
 * @returns {string} fecha formateada (ej: "15/05/2025 10:30")
 */
export function formatDate(isoDate) {
  if (!isoDate) return "N/D";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Extrae solo la parte de fecha de un ISO string.
 * @param {string} isoDate
 * @returns {string} "YYYY-MM-DD" o "N/D"
 */
export function dateOnly(isoDate) {
  if (!isoDate) return "N/D";
  return isoDate.split("T")[0];
}
