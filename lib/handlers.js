module.exports = {
    proxyReqHost : proxyReqHost,
    proxyError   : proxyError
}

function proxyReqHost (proxyReq, req, res, options) {
    _configureHostHeader(proxyReq, options);
};


function proxyError (err, req, res, proxyOptions) {
    var targetUri = proxyOptions.target.host + req.url;

    res.writeHead(500);
    res.end('Error occured while trying to proxy to: '+ proxyOptions.target.host + req.url);

    console.log('[HPM] Proxy error:', err.code, targetUri);
};


function _configureHostHeader (proxyReq, options) {
    var targetHost = options.target.host;

    // @deprecated
    // remove this in next version
    if (options.proxyHost) {
        proxyReq.setHeader('host', targetHost);
    }
    // set host value manually
    else if (typeof options.host === 'string') {
        proxyReq.setHeader('host', options.host);
    }
    // set the host header to match the target host by default
    else {
        proxyReq.setHeader('host', targetHost);
    }
}
