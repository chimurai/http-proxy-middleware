/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */
import type * as http from 'node:http';
import type * as net from 'node:net';

import type { ErrorCallback, ProxyServer, ServerOptions } from 'http-proxy-3';

export type NextFunction<T = (err?: any) => void> = T;

export interface Plugin<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  (proxyServer: ProxyServer, options: Options<TReq, TRes>): void;
}

export interface OnProxyEvent<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  error?: (
    err: Error,
    req: TReq,
    res: TRes,
    target: string | { port: number; host: string; protocol?: string },
  ) => void | ErrorCallback;
  proxyReq?: (
    proxyReq: http.ClientRequest,
    req: TReq,
    res: TRes,
    options: ServerOptions,
    socket: net.Socket,
  ) => void;
  proxyReqWs?: (
    proxyReq: http.ClientRequest,
    req: TReq,
    socket: net.Socket,
    options: ServerOptions,
    head: any,
  ) => void;
  proxyRes?: (proxyRes: TReq, req: TReq, res: TRes) => void;
  open?: (socket: net.Socket) => void;
  close?: (proxyRes: TReq, proxySocket: net.Socket, proxyHead: any) => void;
  start?: (
    req: TReq,
    res: TRes,
    target: string | { port: number; host: string; protocol?: string },
  ) => void;
  end?: (req: TReq, res: TRes, proxyRes: TReq) => void;
  econnreset?: (
    err: Error,
    req: TReq,
    res: TRes,
    target: string | { port: number; host: string; protocol?: string },
  ) => void;
}

export interface RequestHandler<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
  TNext = NextFunction,
> {
  (req: TReq, res: TRes, next?: TNext): Promise<void>;
  upgrade: (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => void;
}

export type Filter<TReq = http.IncomingMessage> =
  | string
  | string[]
  | ((pathname: string, req: TReq) => boolean);

export type Logger = Pick<Console, 'info' | 'warn' | 'error'>;

export interface Options<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
> extends ServerOptions {
  /**
   * Narrow down requests to proxy or not.
   * Filter on {@link http.IncomingMessage.url `pathname`} which is relative to the proxy's "mounting" point in the server.
   * Or use the {@link http.IncomingMessage `req`}  object for more complex filtering.
   * @link https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/pathFilter.md
   * @since v3.0.0
   */
  pathFilter?: Filter<TReq>;
  /**
   * Modify request paths before requests are send to the target.
   * @example
   * ```js
   * createProxyMiddleware({
   *   pathRewrite: {
   *     '^/api/old-path': '/api/new-path', // rewrite path
   *   }
   * });
   * ```
   * @link https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/pathRewrite.md
   */
  pathRewrite?:
    | { [regexp: string]: string }
    | ((path: string, req: TReq) => string | undefined)
    | ((path: string, req: TReq) => Promise<string>);
  /**
   * Access the internal http-proxy server instance to customize behavior
   *
   * @example
   * ```js
   * createProxyMiddleware({
   *   plugins: [(proxyServer, options) => {
   *     proxyServer.on('error', (error, req, res) => {
   *       console.error(error);
   *     });
   *   }]
   * });
   * ```
   * @link https://github.com/chimurai/http-proxy-middleware#plugins-array
   * @since v3.0.0
   */
  plugins?: Plugin<TReq, TRes>[];
  /**
   * Eject pre-configured plugins.
   * NOTE: register your own error handlers to prevent server from crashing.
   *
   * @link https://github.com/chimurai/http-proxy-middleware#ejectplugins-boolean-default-false
   * @since v3.0.0
   */
  ejectPlugins?: boolean;
  /**
   * Listen to http-proxy events
   * @see {@link OnProxyEvent} for available events
   * @example
   * ```js
   * createProxyMiddleware({
   *   on: {
   *     error: (error, req, res, target) => {
   *       console.error(error);
   *     }
   *   }
   * });
   * ```
   * @link https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/proxy-events.md
   * @since v3.0.0
   */
  on?: OnProxyEvent<TReq, TRes>;
  /**
   * Dynamically set the {@link Options.target `options.target`}.
   * @example
   * ```js
   * createProxyMiddleware({
   *   router: async (req) => {
   *     return 'http://127:0.0.1:3000';
   *   }
   * });
   * ```
   * @link https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/router.md
   */
  router?:
    | { [hostOrPath: string]: ServerOptions['target'] }
    | ((req: TReq) => ServerOptions['target'])
    | ((req: TReq) => Promise<ServerOptions['target']>);
  /**
   * Log information from http-proxy-middleware
   * @example
   * ```js
   * createProxyMiddleware({
   *  logger: console
   * });
   * ```
   * @link https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/logger.md
   * @since v3.0.0
   */
  logger?: Logger;
}
