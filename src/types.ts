/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

import type * as http from 'http';
import type * as httpProxy from 'http-proxy';
import type * as net from 'net';
import type * as url from 'url';

export type Request<T = http.IncomingMessage> = T;
export type Response<T = http.ServerResponse> = T;
export type NextFunction<T = (err?: any) => void> = T;

export interface RequestHandler {
  (req: Request, res: Response, next?: NextFunction): void | Promise<void>;
  upgrade?: (req: Request, socket: net.Socket, head: any) => void;
}

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
