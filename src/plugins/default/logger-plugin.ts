import type { ClientRequest, IncomingMessage } from 'node:http';
import type { URL } from 'node:url';

import { getLogger } from '../../logger.js';
import type { Plugin } from '../../types.js';
import { createUrl } from '../../utils/create-url.js';
import { getPort } from '../../utils/logger-plugin.js';
import { definePlugin } from '../define-plugin.js';

type ExpressRequest = {
  /** Express req.baseUrl */
  baseUrl?: string;
};

type BrowserSyncRequest = {
  /** BrowserSync req.originalUrl */
  originalUrl?: string;
};

/** Request Types from different server libs */
type FrameworkRequest = IncomingMessage & ExpressRequest & BrowserSyncRequest;

export const loggerPlugin: Plugin = definePlugin<FrameworkRequest>((proxyServer, options) => {
  const logger = getLogger(options);

  proxyServer.on('error', (err, req, res, target?) => {
    const hostname = req?.headers?.host;
    const requestHref = `${hostname}${req?.url}`;
    const targetHref = `${(target as URL)?.href}`; // target is undefined when websocket errors

    const errorMessage = '[HPM] Error occurred while proxying request %s to %s [%s] (%s)';
    const errReference = 'https://nodejs.org/api/errors.html#errors_common_system_errors'; // link to Node Common Systems Errors page

    logger.error(errorMessage, requestHref, targetHref, (err as any).code || err, errReference);
  });

  /**
   * Log request and response
   * @example
   * ```shell
   * [HPM] GET /users/ -> http://jsonplaceholder.typicode.com/users/ [304]
   * ```
   */
  proxyServer.on('proxyRes', (proxyRes: any, req, res) => {
    // BrowserSync uses req.originalUrl
    // Next.js doesn't have req.baseUrl
    const originalUrl = req.originalUrl ?? `${req.baseUrl || ''}${req.url}`;

    // construct targetUrl
    let target: URL;

    try {
      const port = getPort(proxyRes.req?.agent?.sockets);
      const { protocol, host, path } = proxyRes.req as ClientRequest;

      target = createUrl({ protocol, host, port, path });
      const targetUrl = target.toString();

      const exchange = `[HPM] ${req.method} ${originalUrl} -> ${targetUrl} [${proxyRes.statusCode}]`;
      logger.info(exchange);
    } catch (err) {
      // catch nock v13 issue: protocol and host are undefined
      // (https://github.com/chimurai/http-proxy-middleware/issues/1035)
      console.error('[HPM] Unexpected error while creating target URL', err);
    }
  });

  /**
   * When client opens WebSocket connection
   */
  proxyServer.on('open', (socket) => {
    logger.info('[HPM] Client connected: %o', socket.address());
  });

  /**
   * When client closes WebSocket connection
   */
  proxyServer.on('close', (req, proxySocket, proxyHead) => {
    logger.info('[HPM] Client disconnected: %o', proxySocket.address());
  });
});
