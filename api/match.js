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
    // DETECTAR OPERACIÓN
    // -----------------------
    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    // -----------------------
    // DETECTAR TIPO
    // -----------------------
    let tipoDetectado = null;

    if (texto.includes("casa")) tipoDetectado = "casa";
    else if (texto.includes("depa") || texto.includes("departamento")) tipoDetectado = "departamento";
    else if (texto.includes("oficina") || texto.includes("consultorio")) tipoDetectado = "oficina";
    else if (texto.includes("local")) tipoDetectado = "local";

    // -----------------------
    // DETECTAR PRESUPUESTO
    // -----------------------
    let presupuesto = null;

    const match = texto.match(/\$?\s?([\d,]+)/);
    if (match) {
      presupuesto = parseInt(match[1].replace(/,/g, ""));
    }

    // -----------------------
    // FETCH
    // -----------------------
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    // -----------------------
    // FILTRADO SIMPLE PERO EFECTIVO
    // -----------------------
    const filtradas = data.filter(p => {
      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

      const precioVenta = parseFloat((p["precio de venta"] || "0").toString().replace(/,/g, ""));
      const precioRenta = parseFloat((p["precio de renta"] || "0").toString().replace(/,/g, ""));

      let match = true;

      // operación
      if (buscaVenta) match = match && p["propiedad en venta"] === true;
      if (buscaRenta) match = match && p["propiedad en renta"] === true;

      // tipo
      if (tipoDetectado) match = match && tipo.includes(tipoDetectado);

      // zona (simple pero útil)
      if (texto.length > 5) {
        const palabras = texto.split(" ");
        const coincideZona = palabras.some(palabra =>
          palabra.length > 4 && zona.includes(palabra)
        );

        if (coincideZona) {
          match = match && true;
        }
      }

      // presupuesto
      if (presupuesto) {
        if (buscaVenta && precioVenta) {
          match = match && precioVenta <= presupuesto * 1.3;
        }
        if (buscaRenta && precioRenta) {
          match = match && precioRenta <= presupuesto * 1.3;
        }
      }

      return match;
    });

    res.status(200).json({
      encontrados: filtradas.length,
      matches: filtradas.slice(0, 20)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en servidor" });
  }
}
