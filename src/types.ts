/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

import type * as http from 'http';
import type * as httpProxy from 'http-proxy';
import type * as net from 'net';

export type NextFunction<T = (err?: any) => void> = T;

export interface RequestHandler<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
  TNext = NextFunction
> {
  (req: TReq, res: TRes, next?: TNext): void | Promise<void>;
  upgrade?: (req: http.IncomingMessage, socket: net.Socket, head: any) => void;
}

export type Filter<TReq = http.IncomingMessage> =
  | string
  | string[]
  | ((pathname: string, req: TReq) => boolean);

export interface Plugin<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  (proxyServer: httpProxy<TReq, TRes>, options: Options<TReq, TRes>): void;
}

export interface OnProxyEvent<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  error?: httpProxy.ErrorCallback<Error, TReq, TRes>;
  proxyReq?: httpProxy.ProxyReqCallback<http.ClientRequest, TReq, TRes>;
  proxyReqWs?: httpProxy.ProxyReqWsCallback<http.ClientRequest, TReq>;
  proxyRes?: httpProxy.ProxyResCallback<TReq, TRes>;
  open?: httpProxy.OpenCallback;
  close?: httpProxy.CloseCallback<TReq>;
  start?: httpProxy.StartCallback<TReq, TRes>;
  end?: httpProxy.EndCallback<TReq, TRes>;
  econnreset?: httpProxy.EconnresetCallback<Error, TReq, TRes>;
}

export type Logger = Pick<Console, 'info' | 'warn' | 'error'>;

export interface Options<TReq = http.IncomingMessage, TRes = http.ServerResponse>
  extends httpProxy.ServerOptions {
  /**
   * Narrow down requests to proxy or not.
   * Filter on {@link http.IncomingMessage.url `pathname`} which is relative to the proxy's "mounting" point in the server.
   * Or use the {@link http.IncomingMessage `req`}  object for more complex filtering.
   */
  pathFilter?: Filter<TReq>;
  pathRewrite?:
    | { [regexp: string]: string }
    | ((path: string, req: TReq) => string)
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
   */
  plugins?: Plugin<TReq, TRes>[];
  /**
   * Eject pre-configured plugins.
   * NOTE: register your own error handlers to prevent server from crashing.
   *
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
   */
  on?: OnProxyEvent<TReq, TRes>;
  router?:
    | { [hostOrPath: string]: httpProxy.ServerOptions['target'] }
    | ((req: TReq) => httpProxy.ServerOptions['target'])
    | ((req: TReq) => Promise<httpProxy.ServerOptions['target']>);
  /**
   * Log information from http-proxy-middleware
   * @example
   * ```js
   * createProxyMiddleware({
   *  logger: console
   * });
   * ```
   */
  logger?: Logger | any;
}
