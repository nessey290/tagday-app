// api/overpass.js — Vercel serverless function
// Proxies Overpass API requests to avoid browser CORS restrictions
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
 
  const query = req.method === 'GET'
    ? req.query?.q
    : req.body?.query;
 
  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }
 
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
 
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Overpass API error' });
    }
 
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
 
    }
 
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}