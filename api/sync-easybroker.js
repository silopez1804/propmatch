export default async function handler(req, res) {
  try {
    const EASYBROKER_KEY = "wal7dsh35jnx9057pch4gg2hkpvxzw";
    const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
    const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

    let allProperties = [];
let page = 1;
let hasMore = true;

while (hasMore) {
  const ebResponse = await fetch(`https://api.easybroker.com/v1/properties?page=${page}`, {
    headers: {
      "X-Authorization": EASYBROKER_KEY
    }
  });

  const ebData = await ebResponse.json();

  const propiedades = allProperties;

  allProperties = allProperties.concat(propiedades);

  if (propiedades.length < 20) {
    hasMore = false;
  } else {
    page++;
  }
}
    });

    const ebData = await ebResponse.json();

    const propiedades = ebData.content || [];

    for (let p of propiedades) {

      const data = {
        "id público (EB)": p.public_id,
        "título de propiedad": p.title,
        "tipo de propiedad": p.property_type,
        "colonia/zona/barrio": p.location?.name,
        "precio de venta": p.operations?.find(o => o.type === "sale")?.amount || null,
        "precio de renta": p.operations?.find(o => o.type === "rental")?.amount || null,
        "propiedad en venta": p.operations?.some(o => o.type === "sale"),
        "propiedad en renta": p.operations?.some(o => o.type === "rental")
      };

      await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(data)
      });
    }

    res.status(200).json({
      message: "Sincronización completa",
      total: propiedades.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error sincronizando" });
  }
}
