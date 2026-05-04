export default async function handler(req, res) {
  try {
    res.status(200).json({
      encontrados: 1,
      matches: [{ "título de propiedad": "TEST FUNCIONANDO" }]
    });
  } catch (error) {
    res.status(500).json({ error: "Error en servidor" });
  }
}
