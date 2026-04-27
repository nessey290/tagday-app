// api/overpass.js
const https = require('https');
 
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
 
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let query;
    try { query = JSON.parse(body).query; } catch {}
    if (!query) { res.status(400).json({ error: 'Missing query' }); return; }
 
    const postData = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
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
  });
};