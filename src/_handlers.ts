import type { Options, Request, Response } from './types';
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
  if (typeof handlers.error !== 'function') {
    handlers.error = defaultErrorHandler;
  }

  // add default close handler in absence of close handler
  if (typeof handlers.close !== 'function') {
    handlers.close = logClose;
  }

  return handlers;
}

function defaultErrorHandler(err, req: Request, res: Response) {
  // Re-throw error. Not recoverable since req & res are empty.
  if (!req && !res) {
    throw err; // "Error: Must provide a proper URL as target"
  }

  const host = req.headers && req.headers.host;
  const code = err.code;

  if (res.writeHead && !res.headersSent) {
    if (/HPE_INVALID/.test(code)) {
      res.writeHead(502);
    } else {
      switch (code) {
        case 'ECONNRESET':
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
        case 'ETIMEDOUT':
          res.writeHead(504);
          break;
        default:
          res.writeHead(500);
      }
    }
  }

  res.end(`Error occurred while trying to proxy: ${host}${req.url}`);
}

function logClose(req, socket, head) {
  // view disconnected websocket connections
  logger.info('[HPM] Client disconnected');
}
