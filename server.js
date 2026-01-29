const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const archiver = require('archiver');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    /* ======================
       Serve index.html
    ====================== */
    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        try {
            const html = fs.readFileSync(path.join(__dirname, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(html);
        } catch {
            res.writeHead(500);
            return res.end('index.html not found');
        }
    }

    /* ======================
       Preview API (PNG)
    ====================== */
    if (parsedUrl.pathname === '/generate') {
        const texts = (parsedUrl.query.texts || '')
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);

        if (!texts.length) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'No barcodes supplied' }));
        }

        const results = [];

        for (const text of texts) {
            try {
                const png = await bwipjs.toBuffer({
                    bcid: 'databarexpandedstacked',
                    text,
                    gs1: true,
                    scaleX: 2,
                    scaleY: 1,
                    segments: 6,
                    includetext: true,
                    alttext: text
                });

                results.push({
                    text,
                    image: 'data:image/png;base64,' + png.toString('base64')
                });
            } catch (err) {
                results.push({ text, error: err.message });
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(results));
    }

    /* ======================
       ZIP export (SVG)
    ====================== */
    if (parsedUrl.pathname === '/export-zip') {
        const texts = (parsedUrl.query.texts || '')
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);

        if (!texts.length) {
            res.writeHead(400);
            return res.end('No barcodes supplied');
        }

        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="barcodes.zip"'
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        let i = 1;

        for (const text of texts) {
            try {
                const svg = await bwipjs.toBuffer({
                    bcid: 'databarexpandedstacked',
                    text,
                    gs1: true,
                    scaleX: 2,
                    scaleY: 1,
                    segments: 8,
                    includetext: true,
                    alttext: text,
                    format: 'svg'
                });

                const safe = text.replace(/[^a-zA-Z0-9]/g, '_');
                const name = `${String(i).padStart(3, '0')}_${safe}.svg`;

                archive.append(svg, { name });
                i++;
            } catch (err) {
                archive.append(
                    `ERROR\n${text}\n${err.message}`,
                    { name: `ERROR_${i}.txt` }
                );
                i++;
            }
        }

        archive.finalize();
        return;
    }

    /* ======================
       Fallback
    ====================== */
    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);


/*import http from 'http';
import url from 'url';
import bwipjs from 'bwip-js';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'POST' && parsedUrl.pathname === '/generate') {
    let body = '';

    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { texts } = JSON.parse(body || '{}');

      if (!Array.isArray(texts) || !texts.length) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'No barcodes provided' }));
      }

      const results = [];

      for (const text of texts) {
        try {
          const png = await bwipjs.toBuffer({
            bcid: 'databarexpandedstacked',
            text,
            gs1: true,
            scaleX: 2,
            scaleY: 1,
            segments: 8,
            includetext: true,
            alttext: text
          });

          results.push({
            text,
            image: 'data:image/png;base64,' + png.toString('base64')
          });
        } catch (err) {
          results.push({ text, error: err.message });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});




/*

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // ---------------------------------
    // 1️⃣ Serve index.html
    // ---------------------------------
    if (req.method === 'GET' && pathname === '/') {
        try {
            const html = fs.readFileSync(
                path.join(__dirname, 'index.html'),
                'utf8'
            );
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(html);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end('index.html not found');
        }
    }

    // ---------------------------------
    // 2️⃣ Barcode API
    // ---------------------------------
    if (req.method === 'GET' && pathname === '/generate') {
        if (!query.texts || !query.texts.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
                JSON.stringify({ error: 'Missing ?texts parameter' })
            );
        }

        const texts = query.texts
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);

        const results = [];

        for (const text of texts) {
            try {
                const png = await bwipjs.toBuffer({
                    bcid: 'databarexpandedstacked',
                    text,
                    gs1: true,
                    scaleX: 2,
                    scaleY: 1,
                    segments: 8,
                    includetext: true,
                    alttext: text,
                });

                results.push({
                    text,
                    image: 'data:image/png;base64,' + png.toString('base64'),
                });
            } catch (err) {
                results.push({
                    text,
                    error: err.message,
                });
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(results));
    }

    // ---------------------------------
    // 3️⃣ JSON fallback (belangrijk!)
    // ---------------------------------
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
*/
