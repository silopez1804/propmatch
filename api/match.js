export default async function handler(req, res) {

  // 👉 Permitir CORS (esto evita "error conectando")
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat } = req.body;
    const input = (chat || "").toLowerCase();

    // ===== EXTRAER DATOS =====
    const presupuestoMatch = input.match(/\$?([\d,]+)/);
    const presupuesto = presupuestoMatch
      ? parseInt(presupuestoMatch[1].replace(/,/g, ""))
      : null;

    const recamarasMatch = input.match(/(\d+)\s*(rec|recámara|recámaras)/);
    const recamaras = recamarasMatch ? parseInt(recamarasMatch[1]) : null;

    let zona = null;
    const zonas = ["lomas", "interlomas", "bosques", "tecama", "cuajimalpa", "santa fe"];
    zonas.forEach(z => {
      if (input.includes(z)) zona = z;
    });

    let tipo = null;
    if (/depa|departamento/i.test(input)) tipo = "departamento";
    if (/casa/i.test(input)) tipo = "casa";
    if (/oficina/i.test(input)) tipo = "oficina";

    // ===== FETCH A SUPABASE =====
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    // ===== FILTRO =====
    const matches = data.filter(p => {

      const precio = parseInt((p["precio de renta"] || "").toString().replace(/,/g, "")) || 0;
      const recs = p["recámaras"] || 0;
      const zonaProp = (p["colonia/zona/barrio"] || "").toLowerCase();
      const tipoProp = (p["tipo de propiedad"] || "").toLowerCase();

      return (
        (!presupuesto || precio <= presupuesto) &&
        (!recamaras || recs >= recamaras) &&
        (!zona || zonaProp.includes(zona)) &&
        (!tipo || tipoProp.includes(tipo))
      );
    });

    return res.status(200).json({
      encontrados: matches.length,
      matches: matches.slice(0, 10)
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Error interno", detail: error.message });
  }
}
