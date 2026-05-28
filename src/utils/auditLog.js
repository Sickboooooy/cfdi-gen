const AUDIT_KEY = "cfdi_audit_log";
const MAX_ENTRIES = 100;

export function logEvent(evento, detalle = "") {
  const user = sessionStorage.getItem("cfdi_user") || "anon";
  const entry = {
    timestamp: new Date().toISOString(),
    evento,
    detalle: String(detalle).slice(0, 200),
    user,
  };

  let log = [];
  try {
    log = JSON.parse(sessionStorage.getItem(AUDIT_KEY) || "[]");
  } catch (_) {
    log = [];
  }

  log.push(entry);
  if (log.length > MAX_ENTRIES) {
    log = log.slice(log.length - MAX_ENTRIES);
  }

  try {
    sessionStorage.setItem(AUDIT_KEY, JSON.stringify(log));
  } catch (_) {
    // sessionStorage lleno — ignorar silenciosamente
  }
}

export function getRecentEvents(count = 10) {
  try {
    const log = JSON.parse(sessionStorage.getItem(AUDIT_KEY) || "[]");
    return log.slice(-count).reverse();
  } catch (_) {
    return [];
  }
}
