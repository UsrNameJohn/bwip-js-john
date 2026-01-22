const http = require('http');
const url = require('url');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
    const query = url.parse(req.url, true).query;

    if (!query.texts) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing ?texts parameter' }));
        return;
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
    res.end(JSON.stringify(results));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
