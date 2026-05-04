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

    // zonas (puedes ampliar esto luego)
    const zonas = ["bosques", "lomas", "interlomas", "polanco", "condesa"];

    const zonasDetectadas = zonas.filter(z => texto.includes(z));

    // -----------------------
    // PRESUPUESTO (simple)
    // -----------------------

    let presupuesto = null;

    const matchMillones = texto.match(/(\d+)\s?mill/);
    if (matchMillones) {
      presupuesto = parseInt(matchMillones[1]) * 1000000;
    }

    const matchMiles = texto.match(/(\d{2,3})\s?mil/);
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

    const data = await response.json();

    // -----------------------
    // FILTRADO INTELIGENTE
    // -----------------------

    const filtradas = data.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

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

      // Zona
      if (zonasDetectadas.length > 0) {
        const coincideZona = zonasDetectadas.some(z =>
          zona.includes(z)
        );
        match = match && coincideZona;
      }

      // Presupuesto
      if (presupuesto) {

        if (buscaVenta) {
          const precioVenta = parseFloat(p["precio de venta"] || 0);
          if (precioVenta) {
            match = match && precioVenta <= presupuesto * 1.2;
          }
        }

        if (buscaRenta) {
          const precioRenta = parseFloat(p["precio de renta"] || 0);
          if (precioRenta) {
            match = match && precioRenta <= presupuesto * 1.2;
          }
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
    console.error(error);
    res.status(500).json({ error: "Error en servidor" });
  }
}
