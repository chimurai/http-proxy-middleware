/**
 * Based on definition by DefinitelyTyped:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6f529c6c67a447190f86bfbf894d1061e41e07b7/types/http-proxy-middleware/index.d.ts
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

import type * as http from 'http';
import type * as httpProxy from 'http-proxy';
import type * as net from 'net';

export type Request<T = http.IncomingMessage> = T;
export type Response<T = http.ServerResponse> = T;
export type NextFunction<T = (err?: any) => void> = T;

export interface RequestHandler<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  (req: TReq, res: TRes, next?: NextFunction): void | Promise<void>;
  upgrade?: (req: Request, socket: net.Socket, head: any) => void;
}

export type Filter<TReq = http.IncomingMessage> =
  | string
  | string[]
  | ((pathname: string, req: TReq) => boolean);

export interface Plugin<TReq = http.IncomingMessage, TRes = http.ServerResponse> {
  (proxyServer: httpProxy, options: Options<TReq, TRes>): void;
}

export interface OnProxyEvent {
  error?: httpProxy.ErrorCallback;
  proxyReq?: httpProxy.ProxyReqCallback;
  proxyReqWs?: httpProxy.ProxyReqWsCallback;
  proxyRes?: httpProxy.ProxyResCallback;
  open?: httpProxy.OpenCallback;
  close?: httpProxy.CloseCallback;
  start?: httpProxy.StartCallback;
  end?: httpProxy.EndCallback;
  econnreset?: httpProxy.EconnresetCallback;
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
  on?: OnProxyEvent;
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
