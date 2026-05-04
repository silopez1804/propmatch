export default async function handler(req, res) {
const SUPABASE_URL = "https://rvwdddkfymbcbgvhsnfq.supabase.co";
const SUPABASE_KEY = "sb_publishable_mZWxY9tf9S3U1rMY__JCJA_hV2lqMzD";

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
