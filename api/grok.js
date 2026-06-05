/**
 * /api/grok — Proxy serverless para la API de xAI (Grok).
 * Mantiene GROK_API_KEY en el servidor; nunca expuesta al cliente.
 *
 * Variables de entorno requeridas en Vercel:
 *   GROK_API_KEY — clave de la API de xAI (sin prefijo VITE_)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const grokKey = process.env.GROK_API_KEY;
  if (!grokKey) {
    return res.status(503).json({ error: "Proveedor Grok no configurado en este entorno." });
  }

  const { messages, max_tokens = 4000 } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "El campo messages es requerido." });
  }

  try {
    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokKey}`,
      },
      body: JSON.stringify({ model: "grok-4", max_tokens, messages }),
    });

    const data = await upstream.json();

    if (!upstream.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || "Error de Grok API" });
    }

    const content = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error interno del proxy Grok" });
  }
}
