const resultados = data.map(p => {

  const tipo = (p["tipo de propiedad"] || "").toLowerCase();
  const zona = (p["colonia/zona/barrio"] || "").toLowerCase();

  const precioVenta = parseFloat(
    ((p && p["precio de venta"]) || "0").toString().replace(/,/g, "")
  ) || 0;

  const precioRenta = parseFloat(
    ((p && p["precio de renta"]) || "0").toString().replace(/,/g, "")
  ) || 0;

  let score = 0;

  // Venta / renta
  if (buscaVenta && p["propiedad en venta"] === true) score += 2;
  if (buscaRenta && p["propiedad en renta"] === true) score += 2;

  // Tipo
  if (buscaCasa && tipo.includes("casa")) score += 2;
  if (buscaDepto && tipo.includes("departamento")) score += 2;

  // Zona
  if (zonasDetectadas.length > 0) {
    if (zonasDetectadas.some(z => zona.includes(z))) score += 2;
  }

  // Presupuesto
  if (presupuesto && buscaVenta && precioVenta > 0) {
    if (precioVenta <= presupuesto * 1.2) score += 2;
  }

  if (presupuesto && buscaRenta && precioRenta > 0) {
    if (precioRenta <= presupuesto * 1.2) score += 2;
  }

  return {
    ...p,
    score
  };
});

// FILTRAR SOLO LOS QUE TENGAN ALGO DE MATCH
const filtradas = resultados
  .filter(p => p.score > 2)
  .sort((a, b) => b.score - a.score);
