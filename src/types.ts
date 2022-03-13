/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */

/* eslint-disable @typescript-eslint/no-empty-interface */
import type * as http from 'http';
import type * as httpProxy from 'http-proxy';
import type * as net from 'net';
import type * as url from 'url';

/**
 * @warn Hide `req.url`, as it's unsafe for use due to express
 * mutation.
 *
 * {@link https://github.com/expressjs/express/issues/4854}
 *
 * Use getUrl(req) to get a x-server safe URL.
 */
type ExpressCompatibleIncomingMessage = Omit<http.IncomingMessage, 'url'>;

export type Request = ExpressCompatibleIncomingMessage;
export type Response = http.ServerResponse;

export type Next = (...args: unknown[]) => unknown;

type RequestMiddlewareFunction = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: Next
) => unknown | Promise<unknown>;

export type RequestMiddleware = RequestMiddlewareFunction & {
  upgrade?: (req: Request, socket: net.Socket, head: any) => void;
};

export type Filter = string | string[] | ((pathname: string, req: Request) => boolean);

export interface Options extends httpProxy.ServerOptions {
  pathFilter?: Filter;
  pathRewrite?:
    | { [regexp: string]: string }
    | ((path: string, req: Request) => string)
    | ((path: string, req: Request) => Promise<string>);
  router?:
    | { [hostOrPath: string]: httpProxy.ServerOptions['target'] }
    | ((req: Request) => httpProxy.ServerOptions['target'])
    | ((req: Request) => Promise<httpProxy.ServerOptions['target']>);
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  logProvider?: LogProviderCallback;

  onError?: OnErrorCallback;
  onProxyRes?: OnProxyResCallback;
  onProxyReq?: OnProxyReqCallback;
  onProxyReqWs?: OnProxyReqWsCallback;
  onOpen?: OnOpenCallback;
  onClose?: OnCloseCallback;
}

interface LogProvider {
  log: Logger;
  debug?: Logger;
  info?: Logger;
  warn?: Logger;
  error?: Logger;
}

type Logger = (...args: any[]) => void;

export type LogProviderCallback = (provider: LogProvider) => LogProvider;

/**
 * Use types based on the events listeners from http-proxy
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/51504fd999031b7f025220fab279f1b2155cbaff/types/http-proxy/index.d.ts
 */
export type OnErrorCallback = (
  err: Error,
  req: Request,
  res: Response,
  target?: string | Partial<url.Url>
) => void;
export type OnProxyResCallback = (
  proxyRes: http.IncomingMessage,
  req: Request,
  res: Response
) => void;
export type OnProxyReqCallback = (
  proxyReq: http.ClientRequest,
  req: Request,
  res: Response,
  options: httpProxy.ServerOptions
) => void;
export type OnProxyReqWsCallback = (
  proxyReq: http.ClientRequest,
  req: Request,
  socket: net.Socket,
  options: httpProxy.ServerOptions,
  head: any
) => void;
export type OnCloseCallback = (proxyRes: Response, proxySocket: net.Socket, proxyHead: any) => void;

export type OnOpenCallback = (proxySocket: net.Socket) => void;
