import https from 'https';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const query = req.body?.query;
  if (!query) { res.status(400).json({ error: 'Missing query' }); return; }

  const postData = `data=${encodeURIComponent(query)}`;
  const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // No Content-Length — let Node calculate it automatically
    },
  };

  const request = https.request(options, response => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      try {
        res.status(200).json(JSON.parse(data));
      } catch(e) {
        res.status(500).json({ error: 'Parse error', raw: data.slice(0, 300) });
      }
    });
  });
  request.on('error', err => res.status(500).json({ error: err.message }));
  request.write(postData);
  request.end();
}