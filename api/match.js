module.exports = async (req, res) => {

  try {

    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "TU_SUPABASE_KEY";

    const { chat, modoManual, zona, recamaras, presupuesto, operacion } = req.body;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const propiedades = await response.json();

    // ==========================
    // CLIENTE
    // ==========================
    if (modoManual) {

      const resultados = propiedades.filter(p => {

        const zonaProp = (p["colonia/zona/barrio"] || "").toLowerCase();
        const precio = Number(
          (p["precio de renta"] || p["precio de venta"] || "0")
          .toString()
          .replace(/,/g, "")
        );

        const recProp = Number(p["recámaras"]) || 0;

        let match = true;

        // zona
        if (zona) {
          match = match && zonaProp.includes(zona.toLowerCase());
        }

        // recámaras
        if (recamaras) {
          match = match && recProp >= Number(recamaras);
        }

        // presupuesto ±500k
        if (presupuesto) {

          const pres = Number(presupuesto);
          const margen = 500000;

          match =
            match &&
            precio >= (pres - margen) &&
            precio <= (pres + margen);
        }

        // operación
        if (operacion === "venta") {
          match = match && p["propiedad en venta"] === true;
        }

        if (operacion === "renta") {
          match = match && p["propiedad en renta"] === true;
        }

        return match;

      });

      return res.status(200).json({
        encontrados: resultados.length,
        matches: resultados.slice(0, 10)
      });
    }

    // ==========================
    // WHATSAPP
    // ==========================

    let texto = (chat || "").toLowerCase();

    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    let presupuestoDetectado = null;

    const matchPrecio = texto.match(/\$\s?([\d,]+)/);

    if (matchPrecio) {
      presupuestoDetectado = parseInt(
        matchPrecio[1].replace(/,/g, "")
      );
    }

    const filtradas = propiedades.filter(p => {

      const precioVenta = parseFloat(
        (p["precio de venta"] || "0")
        .toString()
        .replace(/,/g, "")
      );

      const precioRenta = parseFloat(
        (p["precio de renta"] || "0")
        .toString()
        .replace(/,/g, "")
      );

      let match = true;

      if (buscaVenta) {
        match = match && p["propiedad en venta"] === true;
      }

      if (buscaRenta) {
        match = match && p["propiedad en renta"] === true;
      }

      // presupuesto ±500k
      if (presupuestoDetectado) {

        const margen = 500000;

        if (buscaVenta && precioVenta) {

          match =
            match &&
            precioVenta >= (presupuestoDetectado - margen) &&
            precioVenta <= (presupuestoDetectado + margen);
        }

        if (buscaRenta && precioRenta) {

          match =
            match &&
            precioRenta >= (presupuestoDetectado - margen) &&
            precioRenta <= (presupuestoDetectado + margen);
        }
      }

      return match;

    });

    return res.status(200).json({
      encontrados: filtradas.length,
      matches: filtradas.slice(0, 10)
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error en servidor"
    });

  }

};
