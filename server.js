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
