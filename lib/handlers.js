module.exports = {
    proxyError       : proxyError,
    proxyPathRewrite : proxyPathRewrite
}

function proxyError (err, req, res, proxyOptions) {
    var targetUri = proxyOptions.target.host + req.url;

    res.writeHead(500);
    res.end('Error occured while trying to proxy to: '+ proxyOptions.target.host + req.url);

    console.log('[HPM] Proxy error:', err.code, targetUri);
};

function proxyPathRewrite(proxyReq, fnRewriter) {
    proxyReq.path = fnRewriter(proxyReq.path);
}

