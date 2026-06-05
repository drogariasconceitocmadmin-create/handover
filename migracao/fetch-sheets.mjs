// Script temporário: busca CSVs do Google Sheets usando cookies do Chrome
import chromeCookies from 'chrome-cookies-secure';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKUP_ID = '14I_75ojnaihtZIomCuNpq2DQeGCR3EMnbSiA3KPD8GM';
const SHEETS = [
  ['Geral',             'Geral.csv'],
  ['Medicamentos',      'Medicamentos.csv'],
  ['Arquivo_Resolvidos','Arquivo_Resolvidos.csv'],
];

function getCookies(domain) {
  return new Promise((resolve, reject) => {
    chromeCookies.getCookies(domain, 'header', (err, cookies) => {
      if (err) reject(err); else resolve(cookies);
    });
  });
}

function httpsGet(url, cookieHeader) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { Cookie: cookieHeader, 'User-Agent': 'Mozilla/5.0' },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(httpsGet(res.headers.location, cookieHeader));
        } else {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('Obtendo cookies do Chrome para docs.google.com...');
  let cookies;
  try {
    cookies = await getCookies('https://docs.google.com');
    console.log('Cookies obtidos:', typeof cookies === 'string' ? cookies.slice(0, 80) + '...' : '(empty)');
  } catch (e) {
    console.error('Erro ao obter cookies:', e.message);
    process.exit(1);
  }

  if (!cookies) { console.error('Nenhum cookie encontrado.'); process.exit(1); }

  for (const [sheet, filename] of SHEETS) {
    const url = `https://docs.google.com/spreadsheets/d/${BACKUP_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
    console.log(`\nFetching ${sheet}...`);
    const res = await httpsGet(url, cookies);
    const lines = res.data.trim().split('\n');
    console.log(`  Status: ${res.status}, Rows: ${lines.length}, Bytes: ${res.data.length}`);
    if (res.status === 200 && lines.length > 1) {
      const dest = path.join(__dirname, filename);
      fs.writeFileSync(dest, res.data, 'utf8');
      console.log(`  Salvo: ${dest}`);
    } else {
      console.log(`  Preview: ${res.data.slice(0, 200)}`);
    }
  }
  console.log('\nDone.');
})();
