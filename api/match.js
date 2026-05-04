export default async function handler(req, res) {
  try {
    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    const { chat } = req.body;

    if (!chat) {
      return res.status(400).json({ error: "No hay texto" });
    }
// -----------------------
// TIPO DE PROPIEDAD 🔥
// -----------------------
const tipoBuscado = {
  casa: ["casa"],
  departamento: ["depa", "departamento", "ph"],
  oficina: ["oficina", "consultorio"],
  local: ["local", "comercial"]
};

let tipoDetectado = null;

for (const tipo in tipoBuscado) {
  if (tipoBuscado[tipo].some(p => texto.includes(p))) {
    tipoDetectado = tipo;
    break;
  }
    const texto = chat.toLowerCase();

    // -----------------------
    // INTENCIÓN
    // -----------------------
    const buscaVenta = texto.includes("venta");
    const buscaRenta = texto.includes("renta");

    const buscaCasa = texto.includes("casa");
    const buscaDepto =
      texto.includes("depa") || texto.includes("departamento");

    // -----------------------
    // PRESUPUESTO
    // -----------------------
    let presupuesto = null;

    const matchNumeroGrande = texto.match(/\$?\s?([\d,]{6,})/);
    if (matchNumeroGrande) {
      presupuesto = parseInt(matchNumeroGrande[1].replace(/,/g, ""));
    }

    const matchMillones = texto.match(/(\d+)\s?(millones|millon|mill)/);
    if (matchMillones && !presupuesto) {
      presupuesto = parseInt(matchMillones[1]) * 1000000;
    }

    const matchMiles = texto.match(/(\d+)\s?mil/);
    if (matchMiles && !presupuesto) {
      presupuesto = parseInt(matchMiles[1]) * 1000;
    }

    // -----------------------
    // FETCH SUPABASE
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
    // SCORING INTELIGENTE
    // -----------------------
    const resultados = data.map(p => {
      const tipo = (p["tipo de propiedad"] || "").toLowerCase();
      const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

      const precioVenta = parseFloat(
        ((p["precio de venta"]) || "0").toString().replace(/,/g, "")
      ) || 0;

      const precioRenta = parseFloat(
        ((p["precio de renta"]) || "0").toString().replace(/,/g, "")
      ) || 0;

      let score = 0;

      // Operación
      if (buscaVenta && p["propiedad en venta"] === true) score += 2;
      if (buscaRenta && p["propiedad en renta"] === true) score += 2;

      // Tipo
      if (tipoDetectado) {
  if (tipo.includes(tipoDetectado)) {
    score += 3;
  }
      // -----------------------
      // ZONA INTELIGENTE 🔥
      // -----------------------
      const palabrasFiltradas = texto
        .replace(/[^\w\s]/g, "")
        .split(" ")
        .filter(palabra =>
          palabra.length > 4 &&
          ![
            "busco",
            "casa",
            "depto",
            "departamento",
            "venta",
            "renta",
            "recamaras",
            "recamara",
            "presupuesto",
            "millones",
            "millon",
            "mil"
          ].includes(palabra)
        );

      const coincideZona = palabrasFiltradas.some(palabra =>
        zona.includes(palabra)
      );

      if (coincideZona) {
        score += 5;
      }

      // Presupuesto
      if (presupuesto && buscaVenta && precioVenta > 0) {
        if (precioVenta <= presupuesto * 1.3) score += 2;
      }

      if (presupuesto && buscaRenta && precioRenta > 0) {
        if (precioRenta <= presupuesto * 1.3) score += 2;
      }

      return { ...p, score };
    });

    // -----------------------
    // FILTRO FINAL
    // -----------------------
    const filtradas = resultados
      .filter(p => p.score >= 6)
      .sort((a, b) => b.score - a.score);

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
