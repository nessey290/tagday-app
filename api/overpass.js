// api/overpass.js — Vercel serverless function
export const config = { api: { bodyParser: true } };
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  let query;
  if (req.method === 'GET') {
    query = req.query?.q;
  } else {
    // Vercel auto-parses JSON body when Content-Type is application/json
    query = req.body?.query || req.body?.q;
  }
 
  if (!query) {
    return res.status(400).json({ error: 'Missing query', received: JSON.stringify(req.body) });
  }
 
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    const text = await response.text();
    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}