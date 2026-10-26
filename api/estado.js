const { createClient } = require("@libsql/client");
const crypto = require("crypto");

let db = null;

function cliente() {
  if (!db) {
    db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
  }
  return db;
}

function coincideClave(recibida, esperada) {
  if (typeof recibida !== "string" || typeof esperada !== "string") return false;
  const a = Buffer.from(recibida, "utf8");
  const b = Buffer.from(esperada, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    if (!process.env.EDITOR_PASSWORD) {
      return res.status(503).json({
        ok: false,
        error: "La nube está protegida. Configure EDITOR_PASSWORD en las variables de entorno de Vercel."
      });
    }
    if (!coincideClave(req.headers["x-editor-password"], process.env.EDITOR_PASSWORD)) {
      return res.status(401).json({ ok: false, error: "Acceso de edición no autorizado" });
    }
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
      return res.status(503).json({ ok: false, error: "Falta configurar TURSO_URL y TURSO_TOKEN en el servidor" });
    }

    const c = cliente();
    await c.execute("CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, datos TEXT, actualizado INTEGER)");

    if (req.method === "GET") {
      const r = await c.execute({ sql: "SELECT datos FROM estado WHERE id = 'principal'", args: [] });
      const fila = r.rows && r.rows[0];
      return res.status(200).json({ ok: true, estado: fila ? JSON.parse(fila.datos) : null });
    }

    if (req.method === "PUT" || req.method === "POST") {
      let cuerpo = req.body;
      if (typeof cuerpo === "string") {
        try { cuerpo = JSON.parse(cuerpo); }
        catch (e) { return res.status(400).json({ ok: false, error: "JSON no válido" }); }
      }
      if (!cuerpo || !Array.isArray(cuerpo.fichas)) return res.status(400).json({ ok: false, error: "Estado no válido" });
      await c.execute({
        sql: "INSERT OR REPLACE INTO estado (id, datos, actualizado) VALUES ('principal', ?, ?)",
        args: [JSON.stringify(cuerpo), Date.now()]
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Método no permitido" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error de base de datos" });
  }
};
