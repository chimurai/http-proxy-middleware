module.exports = function (proxyReq, req, res, options) {
    var host = options.target.host;
    if (host) {
        proxyReq.setHeader('host', host);
    }
};
