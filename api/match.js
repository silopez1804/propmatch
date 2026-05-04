export default async function handler(req, res) {
const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
const SUPABASE_KEY = "TU_PUBLIC_KEY_AQUI";

const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`
}
});

const data = await response.json();

res.status(200).json({
total_properties: data.length,
sample: data.slice(0, 5)
});
}
