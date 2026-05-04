export default async function handler(req, res) {
const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
const SUPABASE_KEY = "TU_PUBLIC_KEY_AQUI";

const { chat } = req.body;

// Obtener propiedades
const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`
}
});

const properties = await response.json();

// Extraer cosas básicas del chat
const chatLower = chat.toLowerCase();

// detectar presupuesto
let presupuesto = null;
const matchPrecio = chatLower.match(/\d{2,3},?\d{3}/);
if (matchPrecio) {
presupuesto = parseInt(matchPrecio[0].replace(",", ""));
}

// detectar zona simple
const zonas = ["lomas", "polanco", "condesa", "roma", "interlomas", "bosques"];
let zonaDetectada = zonas.find(z => chatLower.includes(z));

// filtrar
const matches = properties.filter(p => {
let ok = true;

```
if (presupuesto && p.precio) {
  ok = ok && p.precio <= presupuesto;
}

if (zonaDetectada && p.zona) {
  ok = ok && p.zona.toLowerCase().includes(zonaDetectada);
}

return ok;
```

});

res.status(200).json({
encontrados: matches.length,
matches: matches.slice(0, 5)
});
}
