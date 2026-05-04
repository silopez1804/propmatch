export default async function handler(req, res) {
  const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

  const { chat } = req.body;

  // Obtener propiedades
  const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const properties = await response.json();

  const chatLower = chat.toLowerCase();

  // detectar presupuesto
  let presupuesto = null;
  const matchPrecio = chatLower.match(/\d{2,3},?\d{3}/);
  if (matchPrecio) {
    presupuesto = parseInt(matchPrecio[0].replace(",", ""));
  }

  // detectar zona
  const zonas = ["lomas", "polanco", "condesa", "roma", "interlomas", "bosques", "santa fe"];
  let zonaDetectada = zonas.find(z => chatLower.includes(z));

  // detectar recámaras
  let recamaras = null;
  const matchRec = chatLower.match(/(\d+)\s*rec/);
  if (matchRec) {
    recamaras = parseInt(matchRec[1]);
  }

  // detectar baños
  let banos = null;
  const matchBan = chatLower.match(/(\d+)\s*bañ/);
  if (matchBan) {
    banos = parseInt(matchBan[1]);
  }

  // detectar estacionamientos
  let estacionamientos = null;
  const matchEst = chatLower.match(/(\d+)\s*(est|auto|coche)/);
  if (matchEst) {
    estacionamientos = parseInt(matchEst[1]);
  }

  // filtrar propiedades
  const matches = properties.filter(p => {
    let ok = true;

    // precio (renta o venta)
    const precio = p["precio renta"] || p["precio venta"];
    if (presupuesto && precio) {
      ok = ok && parseInt(precio) <= presupuesto;
    }

    // zona
    const zona = p["colonia / zona / barrio"];
    if (zonaDetectada && zona) {
      ok = ok && zona.toLowerCase().includes(zonaDetectada);
    }

    // recámaras
    if (recamaras && p["recamaras"]) {
      ok = ok && parseInt(p["recamaras"]) >= recamaras;
    }

    // baños
    if (banos && p["baños"]) {
      ok = ok && parseInt(p["baños"]) >= banos;
    }

    // estacionamientos
    if (estacionamientos && p["estacionamientos"]) {
      ok = ok && parseInt(p["estacionamientos"]) >= estacionamientos;
    }

    return ok;
  });

  res.status(200).json({
    encontrados: matches.length,
    matches: matches.slice(0, 5)
  });
}
