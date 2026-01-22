const http = require('http');
const url = require('url');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;

    if (!query.text) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing ?text parameter');
        return;
    }

    bwipjs.toBuffer({
        bcid: 'gs1databarexpandedstacked',
        text: query.text,
        scaleX: 2,
        scaleY: 1,
        includetext: true,
        alttext: query.text,
    })
    .then(buffer => {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(buffer);
    })
    .catch(err => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.toString());
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
