import type * as http from 'node:http';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ProxyServer } from 'httpxy';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Plugin, Options } from '../types.js';

/**
 * Helper function to define a http-proxy-middleware plugin
 * @see proxyServer {@link ProxyServer} - proxy server instance to which the plugin is being applied
 * @see options {@link Options} - options object passed to `createProxyMiddleware`
 *
 * @example defining a plugin
 * ```js
 * export const myPlugin = definePlugin((proxyServer, options) => {
 *   // plugin implementation
 * });
 * ```
 *
 * @example using a plugin
 * ```js
 * createProxyMiddleware({
 *   target: 'http://example.com',
 *   plugins: [myPlugin],
 * });
 * ```
 *
 * @since 4.1.0
 */
export function definePlugin<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
>(fn: Plugin<TReq, TRes>): Plugin<TReq, TRes> {
  return fn;
}
