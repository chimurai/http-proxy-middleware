import type { Options } from './types';
import type * as httpProxy from 'http-proxy';
import { getInstance } from './logger';
const logger = getInstance();

export function init(proxy: httpProxy, option: Options): void {
  const handlers = getHandlers(option);

  for (const eventName of Object.keys(handlers)) {
    proxy.on(eventName, handlers[eventName]);
  }

  logger.debug('[HPM] Subscribed to http-proxy events:', Object.keys(handlers));
}

type HttpProxyEventName = 'error' | 'proxyReq' | 'proxyReqWs' | 'proxyRes' | 'open' | 'close';

export function getHandlers(options: Options) {
  // https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events
  const proxyEventsMap: Record<HttpProxyEventName, string> = {
    error: 'onError',
    proxyReq: 'onProxyReq',
    proxyReqWs: 'onProxyReqWs',
    proxyRes: 'onProxyRes',
    open: 'onOpen',
    close: 'onClose',
  };

  const handlers: any = {};

  for (const [eventName, onEventName] of Object.entries(proxyEventsMap)) {
    // all handlers for the http-proxy events are prefixed with 'on'.
    // loop through options and try to find these handlers
    // and add them to the handlers object for subscription in init().
    const fnHandler = options ? options[onEventName] : null;

    if (typeof fnHandler === 'function') {
      handlers[eventName] = fnHandler;
    }
  }

  // add default error handler in absence of error handler
  // if (typeof handlers.error !== 'function') {
  //   handlers.error = defaultErrorHandler;
  // }

  return handlers;
}

// /**
//  * Subscribes to http-proxy on('error') event
//  */
// function defaultErrorHandler(err, req: Request, res: Response) {
//   // Re-throw error. Not recoverable since req & res are empty.
//   if (!req && !res) {
//     throw err; // "Error: Must provide a proper URL as target"
//   }

//   if (res.writeHead && !res.headersSent) {
//     const statusCode = getStatusCode(err.code);
//     res.writeHead(statusCode);
//   }

//   const host = req.headers && req.headers.host;
//   res.end(`Error occurred while trying to proxy: ${host}${req.url}`);
// }
