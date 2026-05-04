export default async function handler(req, res) {
  try {
    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat } = req.body;

    if (!chat) {
      return res.status(400).json({ error: "No hay texto" });
    }

    // -----------------------
    // LIMPIAR TEXTO
    // -----------------------
    let texto = chat.toLowerCase()
      .replace(/\n/g, " ")
      .replace(/\[.*?\]/g, "")
      .replace(/[^\w\s$.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // -----------------------
    // DETECTAR TIPO
    // -----------------------
    let tipoDetectado = null;

    if (texto.includes("casa")) tipoDetectado = "casa";
    else if (
      texto.includes("departamento") ||
      texto.includes("depa") ||
      texto.includes("ph") ||
      texto.includes("garden")
    ) tipoDetectado = "departamento";

    // -----------------------
    // OPERACIÓN
    // -----------------------
    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    // -----------------------
    // PRECIO
    // -----------------------
    let presupuesto = null;

    const matchPrecio = texto.match(/\$\s?([\d,]+)/);
    if (matchPrecio) {
      presupuesto = parseInt(matchPrecio[1].replace(/,/g, ""));
    }

    // -----------------------
    // 🔥 DETECTAR RECÁMARAS
    // -----------------------
    let recamaras = null;

    const recMatch = texto.match(/(\d+)\s*(rec|recs|recamara|recamaras|recámara|recámara|habitacion|habitaciones)/);
    if (recMatch) {
      recamaras = parseInt(recMatch[1]);
    }

    // -----------------------
    // 🔥 DETECTAR BAÑOS
    // -----------------------
    let banos = null;

    const banMatch = texto.match(/(\d+)\s*(ba|baño|baños)/);
    if (banMatch) {
      banos = parseInt(banMatch[1]);
    }

    // -----------------------
    // 🔥 DETECTAR ESTACIONAMIENTOS
    // -----------------------
    let estacionamientos = null;

    const estMatch = texto.match(/(\d+)\s*(estac|auto|cajones)/);
    if (estMatch) {
      estacionamientos = parseInt(estMatch[1]);
    }

    // -----------------------
    // FETCH DATA
    // -----------------------
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    // -----------------------
    // ZONAS DESDE BASE
    // -----------------------
    const zonasUnicas = [
      ...new Set(
        data
          .map(p => (p["colonia/zona/barrio"] || "").toLowerCase())
          .filter(z => z.length > 3)
      )
    ];

    const zonasDetectadas = zonasUnicas.filter(z =>
      texto.includes(z)
    );

    // -----------------------
    // ZONAS MACRO
    // -----------------------
    const zonasMacro = [
      "polanco",
      "bosques",
      "interlomas",
      "santa fe",
      "roma",
      "condesa",
      "tecamachalco"
    ];

    const zonaMacroDetectada = zonasMacro.find(z =>
      texto.includes(z)
    );

    // -----------------------
    // FILTRO
    // -----------------------
    const filtradas = data.filter(p => {

      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

      const precioVenta = parseFloat(
        (p["precio de venta"] || "0").toString().replace(/,/g, "")
      );

      const precioRenta = parseFloat(
        (p["precio de renta"] || "0").toString().replace(/,/g, "")
      );

      let match = true;

      // TIPO
      if (tipoDetectado) {
        match = match && tipo.includes(tipoDetectado);
      }

      // OPERACIÓN
      if (buscaVenta) match = match && p["propiedad en venta"] === true;
      if (buscaRenta) match = match && p["propiedad en renta"] === true;

      // PRECIO
      if (presupuesto) {
        if (buscaVenta && precioVenta) {
          match = match && precioVenta <= presupuesto * 1.2;
        }
        if (buscaRenta && precioRenta) {
          match = match && precioRenta <= presupuesto * 1.2;
        }
      }

      // ZONA
      if (zonaMacroDetectada) {
        match = match && zona.includes(zonaMacroDetectada);
      }

      if (zonasDetectadas.length > 0) {
        match = match && zonasDetectadas.some(z => zona.includes(z));
      }

      // 🔥 FILTRO POR CARACTERÍSTICAS (YA CORRECTO)
      if (recamaras !== null) {
        const recProp = Number(p["recámaras"]) || 0;
        if (recamaras <= 2) {
        match = match && recProp === recamaras;
        } else {
        match = match && recProp >= recamaras;
      }

      if (banos !== null) {
        const banProp = Number(p["baños"]) || 0;
        match = match && banProp >= banos;
      }

      if (estacionamientos !== null) {
        const estProp = Number(p["estacionamientos"]) || 0;
        match = match && estProp >= estacionamientos;
      }

      return match;
    });

    // -----------------------
    // ORDENAR
    // -----------------------
    filtradas.sort((a, b) => {
      const precioA = parseFloat((a["precio de venta"] || a["precio de renta"] || 0));
      const precioB = parseFloat((b["precio de venta"] || b["precio de renta"] || 0));
      return precioA - precioB;
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
