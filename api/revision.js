const { createClient } = require("@libsql/client");

let db = null;

function cliente() {
  if (!db) {
    db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
  }
  return db;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
      return res.status(503).json({
        ok: false,
        error: "No hay una base de datos compartida configurada. Configure TURSO_URL y TURSO_TOKEN en Vercel para que el profesor vea los datos guardados."
      });
    }

    const c = cliente();
    await c.execute("CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, datos TEXT, actualizado INTEGER)");
    const r = await c.execute({ sql: "SELECT datos FROM estado WHERE id = 'principal'", args: [] });
    const fila = r.rows && r.rows[0];
    return res.status(200).json({ ok: true, estado: fila ? JSON.parse(fila.datos) : null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "No fue posible cargar la cartografía compartida" });
  }
};
