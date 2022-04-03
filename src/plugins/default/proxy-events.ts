import { debug } from '../../debug';
import { Plugin } from '../../types';

const log = debug.extend('proxy-events-plugin');

/**
 * Implements option.on object to subscribe to http-proxy events.
 *
 * @example
 * ```js
 * createProxyMiddleware({
 *  on: {
 *    error: (error, req, res, target) => {},
 *    proxyReq: (proxyReq, req, res, options) => {},
 *    proxyReqWs: (proxyReq, req, socket, options) => {},
 *    proxyRes: (proxyRes, req, res) => {},
 *    open: (proxySocket) => {},
 *    close: (proxyRes, proxySocket, proxyHead) => {},
 *    start: (req, res, target) => {},
 *    end: (req, res, proxyRes) => {},
 *    econnreset: (error, req, res, target) => {},
 *  }
 * });
 * ```
 */
export const proxyEventsPlugin: Plugin = (proxyServer, options) => {
  Object.entries(options.on || {}).forEach(([eventName, handler]) => {
    proxyServer.on(eventName, handler as (...args: unknown[]) => void);
    log(`registered event handler: "${eventName}"`);
  });
};
