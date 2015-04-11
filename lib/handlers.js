module.exports = {
    proxyReqHost : proxyReqHost,
    proxyError   : proxyError
}

function proxyReqHost (proxyReq, req, res, options) {
    var host = options.target.host;
    if (host) {
        proxyReq.setHeader('host', host);
    }
};


function proxyError (err, req, res, proxyOptions) {
    var targetUri = proxyOptions.target.host + req.url;
    console.log('[HPM] Proxy error:', err.code, targetUri);

    res.writeHead(500);
    res.end('Error occured while trying to proxy to: '+ proxyOptions.target.host + req.url);
};
