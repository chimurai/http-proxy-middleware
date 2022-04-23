import { Debug } from '../../debug';
import { Plugin } from '../../types';

const debug = Debug.extend('debug-proxy-errors-plugin');

/**
 * Subscribe to {@link https://www.npmjs.com/package/http-proxy#listening-for-proxy-events http-proxy error events} to prevent server from crashing.
 * Errors are logged with {@link https://www.npmjs.com/package/debug debug} library.
 */
export const debugProxyErrorsPlugin: Plugin = (proxyServer, options): void => {
  /**
   * http-proxy doesn't handle any errors by default (https://github.com/http-party/node-http-proxy#listening-for-proxy-events)
   * Prevent server from crashing when http-proxy errors (uncaught errors)
   */
  proxyServer.on('error', (error, req, res, target) => {
    debug(`http-proxy error event: \n%O`, error);
  });

  proxyServer.on('proxyReq', (proxyReq, req, socket) => {
    socket.on('error', (error) => {
      debug('Socket error in proxyReq event: \n%O', error);
    });
  });

  proxyServer.on('proxyRes', (proxyRes, req, res) => {
    /**
     * Fix SSE close events
     * @link https://github.com/chimurai/http-proxy-middleware/issues/678
     * @link https://github.com/http-party/node-http-proxy/issues/1520#issue-877626125
     */
    res.on('close', () => {
      if (!res.writableEnded) {
        debug('res close event received, destroying proxyRes');
        proxyRes.destroy();
      }
    });

    /**
     * Fix SSE when backend closes/restarts
     * @link https://github.com/chimurai/http-proxy-middleware/discussions/765
     */
    proxyRes.on('close', () => {
      // don't destroy res when using it in response interceptor
      if (options.selfHandleResponse) {
        return;
      }

      if (!res.writableEnded) {
        debug('proxyRes close event received, destroying res');
        res.destroy();
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
    debug(`http-proxy econnreset event: \n%O`, error);
  });
};
