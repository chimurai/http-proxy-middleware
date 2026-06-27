import type { IncomingMessage } from 'node:http';
import { styleText } from 'node:util';

import { Debug } from '../../debug.js';
import type { Plugin } from '../../types.js';
import { definePlugin } from '../define-plugin.js';

const debug = Debug.extend('debug-proxy-errors-plugin');

const BODY_PARSER_ERROR_MESSAGE = `[HPM] Connection reset (ECONNRESET) detected with non-empty "req.body" [ERR_HPM.GH40].

      This usually means that the POST request body (req.body) was already parsed before reaching the proxy.
      When bodyParser runs first, it consumes the request stream, leaving the proxy unable to forward the body data to the target server.

      How to fix this issue:
      - Option 1: Place the proxy middleware before the bodyParser middleware.
      - Option 2: Use 'fixRequestBody()' helper to fix this issue.

      For more details, see: https://github.com/chimurai/http-proxy-middleware/issues/40\n`;

function hasParsedBody(req: IncomingMessage | undefined): boolean {
  return Boolean(req && req.method === 'POST' && 'body' in req && req.body);
}

/**
 * Subscribe to {@link https://github.com/unjs/httpxy#events `httpxy` error events} to prevent server from crashing.
 * Errors are logged with {@link https://www.npmjs.com/package/debug debug} library.
 */
export const debugProxyErrorsPlugin: Plugin = definePlugin((proxyServer, options) => {
  /**
   * The old `http-proxy` doesn't handle any errors by default (https://github.com/http-party/node-http-proxy#listening-for-proxy-events)
   * > We do not do any error handling of messages passed between client and proxy, and messages passed between proxy and target, so it is recommended that you listen on errors and handle them.
   * Subscribing to error event to prevent server from crashing
   */
  proxyServer.on('error', (error, req, res, target) => {
    debug(`httpxy error event: \n%O`, error);

    // detect request body (when bodyParser used) and log an error message to help debugging
    if ((error as any).code === 'ECONNRESET' && hasParsedBody(req)) {
      console.error(styleText('red', BODY_PARSER_ERROR_MESSAGE));
    }
  });

  proxyServer.on('proxyReq', (proxyReq, req, socket) => {
    socket.on('error', (error) => {
      debug('Socket error in proxyReq event: \n%O', error);
    });
  });

  /**
   * Fix SSE close events
   * @link https://github.com/chimurai/http-proxy-middleware/issues/678
   * @link https://github.com/http-party/node-http-proxy/issues/1520#issue-877626125
   */
  proxyServer.on('proxyRes', (proxyRes, req, res) => {
    res.on('close', () => {
      if (!res.writableEnded) {
        debug('Destroying proxyRes in proxyRes close event');
        proxyRes.destroy();
      }
    });
  });

  /**
   * Fix crash when target server restarts
   * https://github.com/chimurai/http-proxy-middleware/issues/476#issuecomment-746329030
   * https://github.com/webpack/webpack-dev-server/issues/1642#issuecomment-790602225
   */
  proxyServer.on('proxyReqWs', (proxyReq, req, socket) => {
    socket.on('error', (error) => {
      debug('Socket error in proxyReqWs event: \n%O', error);
    });
  });

  proxyServer.on('open', (proxySocket) => {
    proxySocket.on('error', (error) => {
      debug('Socket error in open event: \n%O', error);
    });
  });

  proxyServer.on('close', (req, socket, head) => {
    socket.on('error', (error) => {
      debug('Socket error in close event: \n%O', error);
    });
  });

  // https://github.com/webpack/webpack-dev-server/issues/1642#issuecomment-1103136590
  proxyServer.on('econnreset', (error, req, res, target) => {
    debug(`httpxy econnreset event: \n%O`, error);
  });
});
