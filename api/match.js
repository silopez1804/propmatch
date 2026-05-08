export default async function handler(req, res) {
  try {
    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat, modoManual, zona, recamaras, presupuesto, operacion } = req.body;

    // 🔥 TRAEMOS DATOS PRIMERO
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    // =========================
    // 🧠 MODO CLIENTE (FORMULARIO)
    // =========================
    if (modoManual) {

      let resultados = data.filter(p => {

        const zonaProp = (p["colonia/zona/barrio"] || "").toLowerCase();
        const recProp = Number(p["recámaras"]) || 0;

        const precioVenta = parseFloat((p["precio de venta"] || "0").toString().replace(/,/g, ""));
        const precioRenta = parseFloat((p["precio de renta"] || "0").toString().replace(/,/g, ""));

        let match = true;

        // ZONA
        if (zona) match = match && zonaProp.includes(zona.toLowerCase());

        // RECÁMARAS
        if (recamaras) match = match && recProp >= Number(recamaras);

        // OPERACIÓN + PRECIO
        if (presupuesto) {
          if (operacion === "venta" && precioVenta) {
            match = match && precioVenta <= Number(presupuesto) * 1.2;
          }
          if (operacion === "renta" && precioRenta) {
            match = match && precioRenta <= Number(presupuesto) * 1.2;
          }
        }

        if (operacion === "venta") match = match && p["propiedad en venta"] === true;
        if (operacion === "renta") match = match && p["propiedad en renta"] === true;

        return match;
      });

      return res.json({
        encontrados: resultados.length,
        matches: resultados.slice(0, 20)
      });
    }

    // =========================
    // 💬 MODO WHATSAPP (TU LÓGICA ORIGINAL)
    // =========================

    let texto = chat.toLowerCase()
      .replace(/\n/g, " ")
      .replace(/\[.*?\]/g, "")
      .replace(/[^\w\s$.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    let tipoDetectado = null;
    if (texto.includes("casa")) tipoDetectado = "casa";
    else if (texto.includes("depa") || texto.includes("departamento")) tipoDetectado = "departamento";

    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    let presupuestoChat = null;
    const matchPrecio = texto.match(/\$\s?([\d,]+)/);
    if (matchPrecio) {
      presupuestoChat = parseInt(matchPrecio[1].replace(/,/g, ""));
    }

    let recamarasChat = null;
    const recMatch = texto.match(/(\d+)\s*(rec|recamara|recamaras)/);
    if (recMatch) recamarasChat = parseInt(recMatch[1]);

    const filtradas = data.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const precioVenta = parseFloat((p["precio de venta"] || "0").toString().replace(/,/g, ""));
      const precioRenta = parseFloat((p["precio de renta"] || "0").toString().replace(/,/g, ""));

      let match = true;

      if (tipoDetectado) match = match && tipo.includes(tipoDetectado);
      if (buscaVenta) match = match && p["propiedad en venta"] === true;
      if (buscaRenta) match = match && p["propiedad en renta"] === true;

      if (presupuestoChat) {
        if (buscaVenta && precioVenta) match = match && precioVenta <= presupuestoChat * 1.2;
        if (buscaRenta && precioRenta) match = match && precioRenta <= presupuestoChat * 1.2;
      }

      if (recamarasChat !== null) {
        const recProp = Number(p["recámaras"]) || 0;
        match = match && recProp >= recamarasChat;
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
