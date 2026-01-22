const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // -----------------------------
    // 1️⃣ Serve index.html
    // -----------------------------
    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        try {
            const html = fs.readFileSync(path.join(__dirname, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(html);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end('index.html not found');
        }
    }

    // -----------------------------
    // 2️⃣ Barcode API
    // -----------------------------
    if (parsedUrl.pathname === '/generate') {
        const query = parsedUrl.query;

        if (!query.texts) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing ?texts parameter' }));
        }

        // Meerdere barcodes: 1 per regel
        const texts = query.texts
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);

        const results = [];

        for (const text of texts) {
            try {
                const png = await bwipjs.toBuffer({
                    bcid: 'databarexpandedstacked',
                    text: text,
                    gs1: true,
                    scaleX: 2,
                    scaleY: 1,
                    segments: 8,
                    includetext: true,
                    alttext: text,
                });

                results.push({
                    text,
                    image: 'data:image/png;base64,' + png.toString('base64')
                });

            } catch (err) {
                results.push({
                    text,
                    error: err.message
                });
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(results));
    }

    // -----------------------------
    // 3️⃣ Fallback
    // -----------------------------
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
