import { request as httpsRequest } from 'https';
import { stringify } from 'querystring';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const query = req.body?.query;
  if (!query) { res.status(400).json({ error: 'Missing query' }); return; }

  const postData = stringify({ data: query });

  const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'TagDayApp/1.0',
    },
  };

  const proxyReq = httpsRequest(options, response => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      try {
        res.status(200).json(JSON.parse(data));
      } catch(e) {
        res.status(500).json({ error: 'Parse error', status: response.statusCode, raw: data.slice(0, 300) });
      }
    });
  });
  proxyReq.on('error', err => res.status(500).json({ error: err.message }));
  proxyReq.write(postData);
  proxyReq.end();
}