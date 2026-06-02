/**
 * test-avanzza.mjs — Verificación local de generación de documentos AVANZZA
 * Prueba 2 empresas distintas: Goteborg y Contratus
 *
 * Uso: node test-avanzza.mjs
 * Requiere: servidor corriendo en http://localhost:5173
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS = path.join(__dirname, "test-output");
const EXCEL_PATH = "C:\\Users\\licjo\\Downloads\\EXCEL MANTWENO - GOTEBORG.xlsx";
const APP_URL = "http://localhost:5173";

// Colores para la consola
const ok  = (s) => `\x1b[32m✓ ${s}\x1b[0m`;
const err = (s) => `\x1b[31m✗ ${s}\x1b[0m`;
const inf = (s) => `\x1b[36m→ ${s}\x1b[0m`;
const hdr = (s) => `\x1b[1m\x1b[35m\n═══ ${s} ═══\x1b[0m`;

fs.mkdirSync(DOWNLOADS, { recursive: true });

async function bypassLogin(page) {
  // Inyectar auth antes de que cargue el JS de la app
  await page.addInitScript(() => {
    sessionStorage.setItem("cfdi_auth", "true");
    sessionStorage.setItem("cfdi_user", "tester");
  });
}

async function waitForStep(page, stepNum, timeout = 15000) {
  // El StepIndicator muestra el paso activo
  await page.waitForFunction(
    (n) => document.querySelector(`[data-step="${n}"]`)?.classList.contains("active") ||
            document.body.innerText.includes(`Paso ${n}`) ||
            // fallback: buscar texto indicador
            document.body.innerText.includes("folios encontrado") && n === 2 ||
            document.body.innerText.includes("Documentos a generar") && n === 3 ||
            document.body.innerText.includes("Generando documentos") && n === 4,
    stepNum,
    { timeout }
  );
}

async function testEmpresa(browser, nombre, companyDropdownValue, excelPath) {
  console.log(hdr(`Ejemplo: ${nombre}`));
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Capturar errores de consola
  const errores = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errores.push(msg.text());
  });

  try {
    // ── 1. Abrir app (bypass login) ─────────────────────────────────────────
    await bypassLogin(page);
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    console.log(inf("App cargada"));

    // ── 2. Seleccionar empresa fronting AVANZZA ──────────────────────────────
    if (companyDropdownValue) {
      const frontingSelect = page.locator("select").first();
      await frontingSelect.selectOption(companyDropdownValue);
      await page.waitForTimeout(600);

      // Verificar que se auto-rellenaron campos del receptor
      const rfcValue = await page.locator("input[placeholder*='BBB']").inputValue().catch(() => "");
      if (rfcValue) {
        console.log(ok(`Receptor auto-rellenado: RFC ${rfcValue}`));
      } else {
        console.log(inf("Selector de empresa listo"));
      }
    }

    // Hacer screenshot del paso 1
    await page.screenshot({
      path: path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}_paso1.png`),
      fullPage: false,
    });
    console.log(ok("Screenshot Paso 1 guardado"));

    // ── 3. Subir Excel ───────────────────────────────────────────────────────
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(excelPath);
    await page.waitForTimeout(2000);

    // Esperar a que aparezcan los folios (paso 2)
    await page.waitForSelector("text=/folio/i", { timeout: 10000 });
    const foliosText = await page.locator("text=/folios encontrado/i").textContent().catch(() => "");
    console.log(ok(`Folios detectados: ${foliosText || "✓"}`));

    await page.screenshot({
      path: path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}_paso2.png`),
    });

    // ── 4. Seleccionar todos los folios ──────────────────────────────────────
    const selTodo = page.locator("button", { hasText: /seleccionar todo/i }).first();
    if (await selTodo.isVisible()) {
      await selTodo.click();
      await page.waitForTimeout(400);
    }

    // Continuar al paso 3
    const continueBtn = page.locator("button.btn-primary", { hasText: /continuar/i }).first();
    await continueBtn.click();
    await page.waitForTimeout(1000);
    console.log(ok("Folios seleccionados, avanzando a Paso 3"));

    // ── 5. Paso 3: verificar tipos de documentos y empresa ───────────────────
    await page.waitForSelector("text=/Documentos a generar/i", { timeout: 8000 });

    // Badge de empresa
    const badge = await page.locator("text=/servicios|insumos|materiales|ambos/i").first().textContent().catch(() => "");
    console.log(ok(`Tipo de empresa en DocConfig: ${badge || "(detectado)"}`));

    // Contar checkboxes de documentos
    const checkboxes = await page.locator("input[type=checkbox]").count();
    console.log(ok(`Tipos de documentos disponibles: ${checkboxes}`));

    // Seleccionar todos
    const selTodoDocs = page.locator("button", { hasText: /seleccionar todo/i }).first();
    if (await selTodoDocs.isVisible()) {
      await selTodoDocs.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}_paso3.png`),
    });

    // ── 6. Generar con modo demo ─────────────────────────────────────────────
    // Inyectar API key demo
    await page.evaluate(() => sessionStorage.setItem("cfdi_api_key", "demo"));

    const generateBtn = page.locator("button.btn-primary", { hasText: /generar/i }).first();
    await generateBtn.click();
    console.log(inf("Generando documentos (modo demo)..."));

    // Esperar a que termine la generación
    await page.waitForSelector("text=/documento.*generado|Descargar Word/i", { timeout: 60000 });
    console.log(ok("Generación completada"));

    // ── 7. Verificar badge de membretado ─────────────────────────────────────
    const membretadoBadge = await page.locator("text=/Membretado:/i").textContent().catch(() => "");
    if (membretadoBadge) {
      console.log(ok(`Badge membretado: ${membretadoBadge.trim()}`));
    } else {
      console.log(err("Badge de membretado NO encontrado"));
    }

    await page.screenshot({
      path: path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}_paso4.png`),
    });

    // ── 8. Descargar Word y verificar tamaño ────────────────────────────────
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.locator("button.btn-primary", { hasText: /Descargar Word/i }).click(),
    ]);

    const destFile = path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}.docx`);
    await download.saveAs(destFile);

    const stat = fs.statSync(destFile);
    const sizeKB = Math.round(stat.size / 1024);
    console.log(ok(`Word descargado: ${path.basename(destFile)} (${sizeKB} KB)`));

    if (sizeKB > 100) {
      console.log(ok(`Tamaño ${sizeKB}KB indica contenido e imágenes embebidas`));
    } else {
      console.log(err(`Tamaño ${sizeKB}KB muy pequeño — posible falta de imágenes`));
    }

    // Verificar que el docx contiene imágenes (es un ZIP — buscar /media/)
    const docxBuffer = fs.readFileSync(destFile);
    const hasMedia = docxBuffer.includes(Buffer.from("word/media"));
    if (hasMedia) {
      console.log(ok("El Word contiene carpeta media/ → logos/membretado embebidos ✓"));
    } else {
      console.log(err("El Word NO tiene carpeta media/ → sin logos"));
    }

  } catch (e) {
    console.log(err(`Error en prueba: ${e.message}`));
    await page.screenshot({
      path: path.join(DOWNLOADS, `${nombre.replace(/\s/g,"_")}_error.png`),
    }).catch(() => {});
  } finally {
    if (errores.length) {
      console.log(err(`Errores de consola: ${errores.slice(0, 3).join(" | ")}`));
    }
    await context.close();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: false, slowMo: 200 });

try {
  // Ejemplo 1: Goteborg (tipo: ambos)
  await testEmpresa(
    browser,
    "Goteborg",
    "goteborg",       // valor del <option> en el selector AVANZZA
    EXCEL_PATH
  );

  // Ejemplo 2: Contratus (tipo: servicios)
  await testEmpresa(
    browser,
    "Contratus",
    "contratus",      // valor del <option>
    EXCEL_PATH        // mismo Excel — para demo es válido (distinta config = distinto membretado)
  );

} finally {
  await browser.close();
}

console.log(`\n\x1b[1m\x1b[32mPruebas terminadas. Resultados en: ${DOWNLOADS}\x1b[0m`);
