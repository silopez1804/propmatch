export default async function handler(req, res) {

  try {
    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat } = req.body;

    if (!chat) {
      return res.status(400).json({ error: "No hay texto" });
    }

    const texto = chat.toLowerCase();

    // -----------------------
    // DETECCIÓN DE INTENCIÓN
    // -----------------------

    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    const buscaCasa = texto.includes("casa");
    const buscaDepto =
      texto.includes("depa") ||
      texto.includes("departamento");

    // ZONAS (puedes crecer esto después)
    const zonas = ["bosques", "lomas", "interlomas", "polanco", "condesa"];
    const zonasDetectadas = zonas.filter(z => texto.includes(z));

    // -----------------------
    // PRESUPUESTO INTELIGENTE
    // -----------------------

    let presupuesto = null;

    // 62,000,000
    const matchNumeroGrande = texto.match(/\$?\s?([\d,]{6,})/);
    if (matchNumeroGrande) {
      presupuesto = parseInt(matchNumeroGrande[1].replace(/,/g, ""));
    }

    // 7 millones
    const matchMillones = texto.match(/(\d+)\s?(millones|millon|mill)/);
    if (matchMillones && !presupuesto) {
      presupuesto = parseInt(matchMillones[1]) * 1000000;
    }

    // 30 mil
    const matchMiles = texto.match(/(\d+)\s?mil/);
    if (matchMiles && !presupuesto) {
      presupuesto = parseInt(matchMiles[1]) * 1000;
    }

    // -----------------------
    // TRAER PROPIEDADES
    // -----------------------

    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Error en Supabase" });
    }

    const data = await response.json();

    // -----------------------
    // FILTRADO INTELIGENTE
    // -----------------------

    const filtradas = data.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

      // PRECIOS LIMPIOS (esto arregla el error 🔥)
      const precioVenta = parseFloat(
        ((p && p["precio de venta"]) || "0").toString().replace(/,/g, "")
      ) || 0;

      const precioRenta = parseFloat(
        ((p && p["precio de renta"]) || "0").toString().replace(/,/g, "")
      ) || 0;

      let match = true;

      // Venta / renta
      if (buscaVenta) {
        match = match && p["propiedad en venta"] === true;
      }

      if (buscaRenta) {
        match = match && p["propiedad en renta"] === true;
      }

      // Tipo
      if (buscaCasa) {
        match = match && tipo.includes("casa");
      }

      if (buscaDepto) {
        match = match && (
          tipo.includes("departamento") ||
          tipo.includes("depto")
        );
      }

      // Zona flexible
      if (zonasDetectadas.length > 0) {
        const coincideZona = zonasDetectadas.some(z =>
          zona.includes(z)
        );
        match = match && coincideZona;
      }

      // Presupuesto
      if (presupuesto) {

        if (buscaVenta && precioVenta > 0) {
          match = match && precioVenta <= presupuesto * 1.2;
        }

        if (buscaRenta && precioRenta > 0) {
          match = match && precioRenta <= presupuesto * 1.2;
        }
      }

      return match;
    });

    // -----------------------
    // RESPUESTA
    // -----------------------

    res.status(200).json({
      encontrados: filtradas.length,
      matches: filtradas.slice(0, 20)
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Error en servidor" });
  }
}
