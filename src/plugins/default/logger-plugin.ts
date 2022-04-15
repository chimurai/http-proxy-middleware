import { Plugin } from '../../types';
import { getLogger } from '../../logger';

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
  proxyServer.on('proxyRes', (proxyRes: any, req: any, res) => {
    const exchange = `[HPM] ${req.method} ${req.baseUrl}${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    logger.info(exchange);
  });

  /**
   * When client closes WebSocket connection
   */
  proxyServer.on('close', (req, proxySocket, proxyHead) => {
    logger.info('[HPM] Client disconnected');
  });
};
