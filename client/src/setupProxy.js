const { createProxyMiddleware } = require('http-proxy-middleware');

const base = 'http://localhost:5788';

module.exports = app => {
    app.use(createProxyMiddleware('/realtime', { target: base, ws: true }));
    app.use(createProxyMiddleware('/api', { target: base }));
}