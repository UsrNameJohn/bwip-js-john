const http = require('http');
const url = require('url');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
    const query = url.parse(req.url, true).query;

    // Zorg dat text altijd een array is
    let texts = query.text;
    if (!texts) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Missing ?text parameter(s)');
    }
    if (!Array.isArray(texts)) {
        texts = [texts];
    }

    try {
        const results = [];

        for (const text of texts) {
            const buffer = await bwipjs.toBuffer({
                bcid: 'databarexpandedstacked',
                text,
                segments: 8,
                scaleX: 2,
                scaleY: 1,
                includetext: true,
                alttext: text,
            });

            results.push({
                text,
                image: 'data:image/png;base64,' + buffer.toString('base64'),
            });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));

    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.toString());
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

