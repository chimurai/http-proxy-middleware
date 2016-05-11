var express = require('express');
var proxyMiddleware = require('../../index');

module.exports = {
    createServer: createServer,
    proxyMiddleware: proxyMiddleware
};

function createServer(portNumber, middleware, path) {
    var app = express();

    if (middleware, path) {
        app.use(path, middleware);
    } else if (middleware) {
        app.use(middleware);
    }

    var server = app.listen(portNumber);

    return server;
}
