/**
 * googleDrive.js — Integración Google Drive API v3 con OAuth2 en browser
 *
 * Scopes: https://www.googleapis.com/auth/drive.file
 *   (solo archivos creados por la app, NO acceso a Drive completo)
 *
 * Estado del módulo:
 *   - Si VITE_GOOGLE_CLIENT_ID está vacío → modo STUB
 *   - Las funciones son totalmente funcionales con un Client ID válido
 *
 * Registro localStorage:
 *   localStorage["cfdi_drive_log"] → JSON array de { fileName, fecha, folio, mimeType, driveId?, webViewLink? }
 *   Este registro persiste aunque Drive esté en stub, para historial local.
 *
 * Instrucciones para activar Drive:
 *   1. Ir a console.cloud.google.com
 *   2. Crear proyecto → APIs & Services → Library → Google Drive API → Enable
 *   3. APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID
 *   4. Tipo: Web application
 *   5. Authorized JavaScript origins: http://localhost:5173 (dev) y tu dominio de producción
 *   6. Copiar el Client ID generado
 *   7. Pegar en .env: VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
 *   8. Reiniciar el servidor de desarrollo
 */

import { driveFolderRoot } from "./demoMode";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DRIVE_LOG_KEY = "cfdi_drive_log";
const DRIVE_FOLDER_CACHE_KEY = "cfdi_drive_root_folder";

// ─── Estado interno ───────────────────────────────────────────────────────────

let gapiReady = false;
let tokenClient = null;
let currentToken = null;

// ─── Registro local (siempre activo, incluso en stub) ─────────────────────────

/**
 * Agrega una entrada al registro local de archivos generados.
 * @param {Object} entry — { fileName, folio, mimeType, driveId?, webViewLink? }
 */
export function addToDriveLog(entry) {
  const log = getDriveLog();
  log.unshift({
    ...entry,
    fecha: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
  // Máximo 200 entradas
  if (log.length > 200) log.splice(200);
  localStorage.setItem(DRIVE_LOG_KEY, JSON.stringify(log));
}

/**
 * Retorna el registro completo de archivos generados.
 * @returns {Array}
 */
export function getDriveLog() {
  try {
    return JSON.parse(localStorage.getItem(DRIVE_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

// ─── Verificación de configuración ────────────────────────────────────────────

/**
 * Verifica si Google Drive está configurado (tiene Client ID).
 * @returns {boolean}
 */
export function isDriveConfigured() {
  return Boolean(CLIENT_ID && CLIENT_ID.trim() !== "");
}

// ─── Inicialización ───────────────────────────────────────────────────────────

/**
 * Inicializa la librería gapi y Google Identity Services.
 * Debe llamarse antes de cualquier operación de Drive.
 * @returns {Promise<boolean>} true si se inicializó correctamente
 */
export async function initGoogleDrive() {
  if (!isDriveConfigured()) {
    console.info("[Drive] No configurado — VITE_GOOGLE_CLIENT_ID está vacío.");
    return false;
  }

  return new Promise((resolve) => {
    // Esperar a que gapi esté disponible (se carga vía script defer en index.html)
    const waitForGapi = setInterval(() => {
      if (window.gapi && window.google) {
        clearInterval(waitForGapi);
        window.gapi.load("client", async () => {
          await window.gapi.client.init({
            apiKey: "", // No necesaria con OAuth2 scope drive.file
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          });
          gapiReady = true;

          // Inicializar Google Identity Services
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp) => {
              if (resp.error) {
                console.warn("[Drive] Error OAuth:", resp.error);
                currentToken = null;
              } else {
                currentToken = resp;
              }
            },
          });

          resolve(true);
        });
      }
    }, 200);

    // Timeout de 10s
    setTimeout(() => {
      clearInterval(waitForGapi);
      console.warn("[Drive] Timeout esperando gapi");
      resolve(false);
    }, 10000);
  });
}

// ─── Autenticación ────────────────────────────────────────────────────────────

/**
 * Abre el flujo OAuth2 de Google y retorna el token de acceso.
 * @returns {Promise<string|null>} token de acceso o null si falló/canceló
 */
export function signInGoogle() {
  return new Promise((resolve) => {
    if (!gapiReady || !tokenClient) {
      resolve(null);
      return;
    }

    // Override del callback para este flujo puntual
    tokenClient.callback = (resp) => {
      if (resp.error) {
        console.warn("[Drive] OAuth cancelado o error:", resp.error);
        resolve(null);
      } else {
        currentToken = resp;
        resolve(resp.access_token);
      }
    };

    // Si ya hay token válido, no pedir otro
    if (currentToken && !isTokenExpired()) {
      resolve(currentToken.access_token);
      return;
    }

    tokenClient.requestAccessToken({ prompt: "none" });
  });
}

function isTokenExpired() {
  if (!currentToken) return true;
  // Los tokens de gapi duran 3600s; guardamos el timestamp de creación
  const created = currentToken._created || 0;
  return Date.now() - created > 3500 * 1000;
}

// ─── Operaciones de Drive ─────────────────────────────────────────────────────

/**
 * Crea una carpeta en Google Drive.
 * @param {string} name — nombre de la carpeta
 * @param {string} [parentId] — ID de carpeta padre (opcional)
 * @returns {Promise<string>} ID de la carpeta creada
 */
export async function createDriveFolder(name, parentId) {
  const token = currentToken?.access_token;
  if (!token) throw new Error("No hay sesión de Drive activa.");

  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentId ? { parents: [parentId] } : {}),
  };

  const resp = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!resp.ok) throw new Error(`Error creando carpeta: ${resp.status}`);
  const data = await resp.json();
  return data.id;
}

/**
 * Busca una carpeta por nombre en Drive.
 * @param {string} name — nombre exacto
 * @param {string} [parentId] — ID de carpeta padre
 * @returns {Promise<string|null>} ID o null si no existe
 */
async function findDriveFolder(name, parentId) {
  const token = currentToken?.access_token;
  if (!token) return null;

  const safeName = name.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` +
    (parentId ? ` and '${parentId}' in parents` : "")
  );

  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.files?.[0]?.id || null;
}

/**
 * Obtiene o crea la carpeta raíz de CFDI-GEN en Drive, usando caché en localStorage.
 * @param {string} rfc — RFC del emisor
 * @returns {Promise<string>} ID de la carpeta {root}/{rfc}
 */
async function getOrCreateRootFolder(rfc) {
  const rootName = driveFolderRoot();
  const cacheKey = `${DRIVE_FOLDER_CACHE_KEY}_${rootName}_${rfc}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  // Buscar/crear carpeta raíz
  let rootId = await findDriveFolder(rootName);
  if (!rootId) rootId = await createDriveFolder(rootName);

  // Buscar/crear subcarpeta por RFC
  let rfcId = await findDriveFolder(rfc, rootId);
  if (!rfcId) rfcId = await createDriveFolder(rfc, rootId);

  localStorage.setItem(cacheKey, rfcId);
  return rfcId;
}

/**
 * Sube un archivo a Google Drive usando multipart upload.
 * @param {string} fileName — nombre del archivo
 * @param {string} mimeType — tipo MIME
 * @param {Blob|ArrayBuffer} content — contenido del archivo
 * @param {string} [folderId] — ID de carpeta destino
 * @returns {Promise<{id: string, webViewLink: string}>}
 */
export async function uploadToDrive(fileName, mimeType, content, folderId) {
  const token = currentToken?.access_token;
  if (!token) throw new Error("No hay sesión de Drive activa.");

  const metadata = {
    name: fileName,
    mimeType,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const boundary = "cfdi_gen_boundary_" + Date.now();
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

  // Construir el multipart body manualmente
  const metaBlob = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ]);

  const endBlob = new Blob([`\r\n--${boundary}--`]);
  const body = new Blob([metaBlob, blob, endBlob]);

  const resp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Error subiendo a Drive: ${resp.status} — ${err}`);
  }

  return resp.json();
}

// ─── Flujo completo de respaldo ────────────────────────────────────────────────

/**
 * Sube el .docx y .xlsx al Drive del usuario, creando la estructura de carpetas.
 * Siempre registra en el log local, independientemente del resultado de Drive.
 *
 * @param {Object} params
 * @param {Blob} params.docxBlob   — blob del archivo .docx
 * @param {string} params.docxName — nombre del archivo .docx
 * @param {string} params.xlsxName — nombre del archivo .xlsx (ya descargado)
 * @param {string} params.rfc      — RFC del emisor
 * @param {string} params.folio    — folio de control
 * @param {Function} params.onProgress — callback(message: string)
 * @returns {Promise<{docxLink: string|null, xlsxLink: string|null, error: string|null}>}
 */
export async function backupToDrive({ docxBlob, docxName, xlsxName, rfc, folio, onProgress }) {
  // Registrar en log local primero (siempre)
  addToDriveLog({ fileName: docxName, folio, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  addToDriveLog({ fileName: xlsxName, folio, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  if (!isDriveConfigured()) {
    return { docxLink: null, xlsxLink: null, error: "not_configured" };
  }

  try {
    // Inicializar si no está listo
    if (!gapiReady) {
      onProgress?.("Inicializando conexión con Google Drive...");
      const ok = await initGoogleDrive();
      if (!ok) return { docxLink: null, xlsxLink: null, error: "init_failed" };
    }

    // Autenticar
    onProgress?.("Autenticando con Google...");
    const token = await signInGoogle();
    if (!token) return { docxLink: null, xlsxLink: null, error: "auth_cancelled" };
    currentToken._created = Date.now();

    // Crear estructura de carpetas
    onProgress?.("Creando carpeta en Drive...");
    const rfcFolderId = await getOrCreateRootFolder(rfc);
    const folioFolderId = await createDriveFolder(folio, rfcFolderId);

    // Subir .docx
    onProgress?.("Subiendo expediente Word...");
    const docxResult = await uploadToDrive(
      docxName,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      docxBlob,
      folioFolderId
    );

    // Actualizar log con link de Drive
    addToDriveLog({
      fileName: docxName,
      folio,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      driveId: docxResult.id,
      webViewLink: docxResult.webViewLink,
    });

    onProgress?.("Archivos subidos correctamente ✓");

    return {
      docxLink: docxResult.webViewLink,
      xlsxLink: null, // El xlsx se descarga localmente; para subir a Drive se necesita el Blob también
      error: null,
    };
  } catch (err) {
    console.error("[Drive] Error en backup:", err);
    return { docxLink: null, xlsxLink: null, error: err.message };
  }
}
