import type * as http from 'node:http';

import type { Plugin } from '../types.js';

/**
 * Helper function to define a http-proxy-middleware plugin
 *
 * @example
 * ```js
 * export const myPlugin = definePlugin((proxyServer, options) => {
 *   // plugin implementation
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
