import { URL } from 'url';
import { Plugin } from '../../types';
import { getLogger } from '../../logger';
import type { IncomingMessage } from 'node:http';
import { getPort } from '../../utils/logger-plugin';

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

export const loggerPlugin: Plugin = (proxyServer, options) => {
  const logger = getLogger(options);

  proxyServer.on('error', (err, req, res, target?) => {
    const hostname = req?.headers?.host;
    const requestHref = `${hostname}${req?.url}`;
    const targetHref = `${(target as unknown as any)?.href}`; // target is undefined when websocket errors

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
  proxyServer.on('proxyRes', (proxyRes: any, req: FrameworkRequest, res) => {
    // BrowserSync uses req.originalUrl
    // Next.js doesn't have req.baseUrl
    const originalUrl = req.originalUrl ?? `${req.baseUrl || ''}${req.url}`;

    // construct targetUrl
    const port = getPort(proxyRes.req?.agent?.sockets);

    const obj = {
      protocol: proxyRes.req.protocol,
      host: proxyRes.req.host,
      pathname: proxyRes.req.path,
    } as URL;

    const target = new URL(`${obj.protocol}//${obj.host}${obj.pathname}`);

    if (port) {
      target.port = port;
    }
    const targetUrl = target.toString();

    const exchange = `[HPM] ${req.method} ${originalUrl} -> ${targetUrl} [${proxyRes.statusCode}]`;
    logger.info(exchange);
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
};
