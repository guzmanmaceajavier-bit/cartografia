const { createClient } = require("@libsql/client");

let db = null;

function cliente() {
  if (!db) {
    db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
  }
  return db;
}

module.exports = async function handler(req, res) {
  try {
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
      return res.status(500).json({ ok: false, error: "Falta configuracion del servidor" });
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
        catch (e) { return res.status(400).json({ ok: false }); }
      }
      if (!cuerpo || !Array.isArray(cuerpo.fichas)) return res.status(400).json({ ok: false });
      await c.execute({
        sql: "INSERT OR REPLACE INTO estado (id, datos, actualizado) VALUES ('principal', ?, ?)",
        args: [JSON.stringify(cuerpo), Date.now()]
      });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error de base de datos" });
  }
};
