// Servidor estático mínimo para testar o app localmente (node server.js).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'web');
const PORT = process.env.PORT || 8777;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.ico':'image/x-icon' };

const MIGDIR = path.join(__dirname, 'migracao');
const ALLOWED_CSV = ['Geral.csv','Medicamentos.csv','Arquivo_Resolvidos.csv','Compras_Reposicao.csv','Checklist_Turnos.csv','Auditoria_Handover.csv'];

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // Endpoint temporário para receber CSVs do browser
  if (req.method === 'POST' && req.url === '/write-csv') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const { filename, content } = JSON.parse(body);
        if (!ALLOWED_CSV.includes(filename)) { res.writeHead(400); return res.end('invalid filename'); }
        fs.writeFileSync(path.join(MIGDIR, filename), content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filename, bytes: content.length }));
      } catch(e) { res.writeHead(500); res.end(e.message); }
    });
    return;
  }

  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Handover v2 em http://localhost:' + PORT));
