module.exports = async (req, res) => {

  try {

    const SUPABASE_URL =
      "https://rvwdddkfymbcbgvhsnfq.supabase.co";

    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d2RkZGtmeW1iY2JndmhzbmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTQ1NjAsImV4cCI6MjA5MzQzMDU2MH0.fOqf2sEhOLp2qoV5hCNBI63_PQeWLGWiY-n88Xgei7M";

    const {
      chat,
      modoManual,
      zona,
      recamaras,
      presupuesto,
      operacion
    } = req.body;

    // =========================
    // FETCH SUPABASE
    // =========================

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const propiedades = await response.json();

    // =========================
    // MODO CLIENTE
    // =========================

    if (modoManual) {

      const resultados = propiedades.filter(p => {

        const zonaProp =
          (p["colonia/zona/barrio"] || "")
          .toLowerCase();

        const precio =
          Number(
            (
              p["precio de renta"] ||
              p["precio de venta"] ||
              "0"
            )
            .toString()
            .replace(/,/g, "")
          );

        const recProp =
          Number(p["recámaras"]) || 0;

        let match = true;

        // ZONA
        if (zona) {

          match =
            match &&
            zonaProp.includes(
              zona.toLowerCase()
            );
        }

        // RECÁMARAS
        if (recamaras) {

          match =
            match &&
            recProp >= Number(recamaras);
        }

        // PRESUPUESTO ±500k
        if (presupuesto) {

          const pres =
            Number(presupuesto);

          const margen = 500000;

          match =
            match &&
            precio >= (pres - margen) &&
            precio <= (pres + margen);
        }

        // OPERACIÓN
        if (operacion === "venta") {

          match =
            match &&
            p["propiedad en venta"] === true;
        }

        if (operacion === "renta") {

          match =
            match &&
            p["propiedad en renta"] === true;
        }

        return match;

      });

      return res.status(200).json({
        encontrados: resultados.length,
        matches: resultados.slice(0, 10)
      });
    }

    // =========================
    // MODO WHATSAPP
    // =========================

    let texto =
      (chat || "")
      .toLowerCase()
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // OPERACIÓN

    const buscaVenta =
      texto.includes("venta");

    const buscaRenta =
      texto.includes("renta");

    // PRESUPUESTO

    let presupuestoDetectado = null;

    const matchPrecio =
      texto.match(/\$?\s?([\d,]+)/);

    if (matchPrecio) {

      presupuestoDetectado =
        parseInt(
          matchPrecio[1]
          .replace(/,/g, "")
        );
    }

    // RECÁMARAS

    let recamarasDetectadas = null;

    const recMatch =
      texto.match(
        /(\d+)\s*(rec|recamara|recamaras|habitacion|habitaciones)/
      );

    if (recMatch) {

      recamarasDetectadas =
        parseInt(recMatch[1]);
    }

    // FILTRO

    const filtradas = propiedades.filter(p => {

      const precioVenta =
        parseFloat(
          (
            p["precio de venta"] || "0"
          )
          .toString()
          .replace(/,/g, "")
        );

      const precioRenta =
        parseFloat(
          (
            p["precio de renta"] || "0"
          )
          .toString()
          .replace(/,/g, "")
        );

      const recProp =
        Number(p["recámaras"]) || 0;

      let match = true;

      // OPERACIÓN

      if (buscaVenta) {

        match =
          match &&
          p["propiedad en venta"] === true;
      }

      if (buscaRenta) {

        match =
          match &&
          p["propiedad en renta"] === true;
      }

      // PRESUPUESTO ±500k

      if (presupuestoDetectado) {

        const margen = 500000;

        if (
          buscaVenta &&
          precioVenta
        ) {

          match =
            match &&
            precioVenta >=
              (presupuestoDetectado - margen) &&
            precioVenta <=
              (presupuestoDetectado + margen);
        }

        if (
          buscaRenta &&
          precioRenta
        ) {

          match =
            match &&
            precioRenta >=
              (presupuestoDetectado - margen) &&
            precioRenta <=
              (presupuestoDetectado + margen);
        }
      }

      // RECÁMARAS

      if (
        recamarasDetectadas !== null
      ) {

        match =
          match &&
          recProp >= recamarasDetectadas;
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
