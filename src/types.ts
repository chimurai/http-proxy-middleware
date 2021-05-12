/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

import type * as express from 'express';
import type * as http from 'http';
import type * as httpProxy from 'http-proxy';
import type * as net from 'net';

export interface Request extends express.Request {}
export interface Response extends express.Response {}

export interface RequestHandler extends express.RequestHandler {
  upgrade?: (req: Request, socket: net.Socket, head: any) => void;
}

export type Filter = string | string[] | ((pathname: string, req: Request) => boolean);

export interface Options extends httpProxy.ServerOptions {
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

export type OnErrorCallback = (err: Error, req: Request, res: Response) => void;
export type OnProxyResCallback = (
  proxyRes: http.IncomingMessage,
  req: Request,
  res: Response
) => void;
export type OnProxyReqCallback = (
  proxyReq: http.ClientRequest,
  req: Request,
  res: Response
) => void;
export type OnProxyReqWsCallback = (
  proxyReq: http.ClientRequest,
  req: Request,
  socket: net.Socket,
  options: httpProxy.ServerOptions,
  head: any
) => void;
export type OnCloseCallback = (res: Response, socket: net.Socket, head: any) => void;

export type OnOpenCallback = (proxySocket: net.Socket) => void;
