export default async function handler(req, res) {

  const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

  const { text } = req.body;

  // ====== NORMALIZAR TEXTO ======
  const input = text.toLowerCase();

  // ====== EXTRAER PRESUPUESTO ======
  const presupuestoMatch = input.match(/\$?([\d,]+)/);
  const presupuesto = presupuestoMatch
    ? parseInt(presupuestoMatch[1].replace(/,/g, ""))
    : null;

  // ====== EXTRAER RECÁMARAS ======
  const recamarasMatch = input.match(/(\d+)\s*(rec|recámara|recámaras)/);
  const recamaras = recamarasMatch ? parseInt(recamarasMatch[1]) : null;

  // ====== EXTRAER ZONA (puedes ampliar esto después) ======
  let zona = null;
  const zonas = ["lomas", "interlomas", "bosques", "tecama", "cuajimalpa", "santa fe"];
  zonas.forEach(z => {
    if (input.includes(z)) zona = z;
  });

  // ====== DETECTAR TIPO DE PROPIEDAD ======
  let tipo = null;

  if (/depa|departamento/i.test(input)) tipo = "departamento";
  if (/casa/i.test(input)) tipo = "casa";
  if (/oficina/i.test(input)) tipo = "oficina";
  if (/local/i.test(input)) tipo = "local";
  if (/terreno/i.test(input)) tipo = "terreno";

  // ====== TRAER PROPIEDADES ======
  const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await response.json();

  // ====== FILTRAR MATCHES ======
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

  // ====== RESPUESTA ======
  res.status(200).json({
    encontrados: matches.length,
    matches: matches.slice(0, 10)
  });
}
