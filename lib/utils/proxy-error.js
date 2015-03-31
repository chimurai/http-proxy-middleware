module.exports = function(err, req, res, proxyOptions) {
    var targetUri = proxyOptions.target.host + req.url;
    console.log('[HPM] Proxy error:', err.code, targetUri);

    res.writeHead(500);
    res.end('Error occured while trying to proxy to: '+ proxyOptions.target.host + req.url);
};
