"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const logger_1 = require("./logger");
const logger = logger_1.getInstance();
function init(proxy, option) {
    const handlers = getHandlers(option);
    for (const eventName of Object.keys(handlers)) {
        proxy.on(eventName, handlers[eventName]);
    }
    logger.debug('[HPM] Subscribed to http-proxy events:', Object.keys(handlers));
}
exports.init = init;
function getHandlers(options) {
    // https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events
    const proxyEvents = [
        'error',
        'proxyReq',
        'proxyReqWs',
        'proxyRes',
        'open',
        'close'
    ];
    const handlers = {};
    for (const event of proxyEvents) {
        // all handlers for the http-proxy events are prefixed with 'on'.
        // loop through options and try to find these handlers
        // and add them to the handlers object for subscription in init().
        const eventName = _.camelCase('on ' + event);
        const fnHandler = _.get(options, eventName);
        if (_.isFunction(fnHandler)) {
            handlers[event] = fnHandler;
        }
    }
    // add default error handler in absence of error handler
    if (!_.isFunction(handlers.error)) {
        handlers.error = defaultErrorHandler;
    }
    // add default close handler in absence of close handler
    if (!_.isFunction(handlers.close)) {
        handlers.close = logClose;
    }
    return handlers;
}
exports.getHandlers = getHandlers;
function defaultErrorHandler(err, req, res) {
    const host = req.headers && req.headers.host;
    const code = err.code;
    if (res.writeHead && !res.headersSent) {
        if (/HPE_INVALID/.test(code)) {
            res.writeHead(502);
        }
        else {
            switch (code) {
                case 'ECONNRESET':
                case 'ENOTFOUND':
                case 'ECONNREFUSED':
                    res.writeHead(504);
                    break;
                default:
                    res.writeHead(500);
            }
        }
    }
    res.end('Error occured while trying to proxy to: ' + host + req.url);
}
function logClose(req, socket, head) {
    // view disconnected websocket connections
    logger.info('[HPM] Client disconnected');
}
