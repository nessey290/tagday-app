// api/overpass.js — Vercel serverless function using https module
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let query;
  if (req.method === 'GET') {
    query = req.query?.q;
  } else {
    query = req.body?.query || req.body?.q;
  }

  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  const postData = `data=${encodeURIComponent(query)}`;

  return new Promise((resolve) => {
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          res.status(200).json(JSON.parse(data));
        } catch {
          res.status(500).json({ error: 'Invalid response from Overpass', raw: data.slice(0, 200) });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });

    request.write(postData);
    request.end();
  });
};