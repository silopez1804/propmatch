export default async function handler(req, res) {
  try {

    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat, modoManual, zona, recamaras, presupuesto, operacion } = req.body;

    // 🔥 TRAER PROPIEDADES
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const propiedades = await response.json();

    // =====================================================
    // 🟠 MODO CLIENTE (manual)
    // =====================================================
    if (modoManual) {

      // 🚫 evitar búsquedas vacías
      if (!zona && !presupuesto) {
        return res.json({
          encontrados: 0,
          matches: []
        });
      }

      const resultados = propiedades.filter(p => {

        const zonaProp = (p["colonia/zona/barrio"] || "").toLowerCase();
        const precio = Number((p["precio de renta"] || p["precio de venta"] || "0").toString().replace(/,/g, ""));
        const recProp = Number(p["recámaras"]) || 0;
        const operacionProp = (p["tipo de operación"] || "").toLowerCase();

        return (
          (!zona || zonaProp.includes(zona)) &&
          (!recamaras || recProp >= Number(recamaras)) &&
          (!presupuesto || precio <= Number(presupuesto) * 1.1) &&
          (!operacion || operacionProp.includes(operacion))
        );
      });

      return res.json({
        encontrados: resultados.length,
        matches: resultados.slice(0, 8) // 🔥 solo mejores 8
      });
    }

    // =====================================================
    // 🟢 MODO WHATSAPP (inteligente)
    // =====================================================

    let texto = chat.toLowerCase()
      .replace(/\n/g, " ")
      .replace(/\[.*?\]/g, "")
      .replace(/[^\w\s$.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // TIPO
    let tipoDetectado = null;
    if (texto.includes("casa")) tipoDetectado = "casa";
    else if (texto.includes("depa") || texto.includes("departamento")) tipoDetectado = "departamento";

    // OPERACIÓN
    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    // PRECIO
    let presupuestoDetectado = null;
    const matchPrecio = texto.match(/\$\s?([\d,]+)/);
    if (matchPrecio) {
      presupuestoDetectado = parseInt(matchPrecio[1].replace(/,/g, ""));
    }

    // RECÁMARAS
    let recamarasDetectadas = null;
    const recMatch = texto.match(/(\d+)\s*(rec|recamara|recamaras|habitacion|habitaciones)/);
    if (recMatch) recamarasDetectadas = parseInt(recMatch[1]);

    // FILTRO
    const filtradas = propiedades.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const precioVenta = parseFloat((p["precio de venta"] || "0").toString().replace(/,/g, ""));
      const precioRenta = parseFloat((p["precio de renta"] || "0").toString().replace(/,/g, ""));
      const recProp = Number(p["recámaras"]) || 0;

      let match = true;

      // tipo
      if (tipoDetectado) match = match && tipo.includes(tipoDetectado);

      // operación
      if (buscaVenta) match = match && p["propiedad en venta"] === true;
      if (buscaRenta) match = match && p["propiedad en renta"] === true;

      // precio
      if (presupuestoDetectado) {
        if (buscaVenta && precioVenta) {
          match = match && precioVenta <= presupuestoDetectado * 1.1;
        }
        if (buscaRenta && precioRenta) {
          match = match && precioRenta <= presupuestoDetectado * 1.1;
        }
      }

      // recámaras
      if (recamarasDetectadas !== null) {
        match = match && recProp >= recamarasDetectadas;
      }

      return match;
    });

    res.status(200).json({
      encontrados: filtradas.length,
      matches: filtradas.slice(0, 8) // 🔥 solo top 8
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en servidor" });
  }
}
