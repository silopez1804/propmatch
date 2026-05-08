export default async function handler(req, res) {
  try {

    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat, modoManual, zona, recamaras, presupuesto, operacion } = req.body;

    // 🔥 traer propiedades
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

      const resultados = propiedades.filter(p => {

        const zonaProp = (p["colonia/zona/barrio"] || "").toLowerCase();
        const precio = Number((p["precio de renta"] || p["precio de venta"] || "0").toString().replace(/,/g, ""));
        const recProp = Number(p["recámaras"]) || 0;
        const operacionProp = (p["tipo de operación"] || "").toLowerCase();

        let match = true;

        // zona (suave)
        if (zona) {
          match = match && zonaProp.includes(zona.toLowerCase());
        }

        // recámaras
        if (recamaras) {
          match = match && recProp >= Number(recamaras);
        }

        // presupuesto (más flexible 🔥)
        if (presupuesto) {
          const pres = Number(presupuesto);
          match = match && precio <= pres * 1.3; // antes 1.1 → muy cerrado
        }

        // operación
        if (operacion) {
          match = match && operacionProp.includes(operacion);
        }

        return match;
      });

      return res.json({
        encontrados: resultados.length,
        matches: resultados.slice(0, 10) // más resultados útiles
      });
    }

    // =====================================================
    // 🟢 MODO WHATSAPP
    // =====================================================

    let texto = (chat || "")
      .toLowerCase()
      .replace(/\n/g, " ")
      .replace(/\[.*?\]/g, "")
      .replace(/[^\w\s$.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // tipo
    let tipoDetectado = null;
    if (texto.includes("casa")) tipoDetectado = "casa";
    else if (texto.includes("depa") || texto.includes("departamento")) tipoDetectado = "departamento";

    // operación
    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    // precio
    let presupuestoDetectado = null;
    const matchPrecio = texto.match(/\$\s?([\d,]+)/);
    if (matchPrecio) {
      presupuestoDetectado = parseInt(matchPrecio[1].replace(/,/g, ""));
    }

    // recámaras
    let recamarasDetectadas = null;
    const recMatch = texto.match(/(\d+)\s*(rec|recamara|recamaras|habitacion|habitaciones)/);
    if (recMatch) recamarasDetectadas = parseInt(recMatch[1]);

    const filtradas = propiedades.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const precioVenta = parseFloat((p["precio de venta"] || "0").toString().replace(/,/g, ""));
      const precioRenta = parseFloat((p["precio de renta"] || "0").toString().replace(/,/g, ""));
      const recProp = Number(p["recámaras"]) || 0;

      let match = true;

      // tipo
      if (tipoDetectado) {
        match = match && tipo.includes(tipoDetectado);
      }

      // operación
      if (buscaVenta) match = match && p["propiedad en venta"] === true;
      if (buscaRenta) match = match && p["propiedad en renta"] === true;

      // precio (más flexible 🔥)
      if (presupuestoDetectado) {
        if (buscaVenta && precioVenta) {
          match = match && precioVenta <= presupuestoDetectado * 1.3;
        }
        if (buscaRenta && precioRenta) {
          match = match && precioRenta <= presupuestoDetectado * 1.3;
        }
      }

      // recámaras
      if (recamarasDetectadas !== null) {
        match = match && recProp >= recamarasDetectadas;
      }

      return match;
    });

    return res.status(200).json({
      encontrados: filtradas.length,
      matches: filtradas.slice(0, 10)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en servidor" });
  }
}
