// import * as httpProxy from 'http-proxy';
import { Options } from '..';

/**
 * @deprecated
 *
 * Will be removed in a future version.
 */
export interface LegacyOptions extends Options {
  /**
   * @deprecated
   * Use `on.error` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    error: () => {}
   * }
   * ```
   */
  onError?: (...args: any[]) => void; //httpProxy.ErrorCallback;
  /**
   * @deprecated
   * Use `on.proxyRes` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    proxyRes: () => {}
   * }
   * ```
   */
  onProxyRes?: (...args: any[]) => void; //httpProxy.ProxyResCallback;
  /**
   * @deprecated
   * Use `on.proxyReq` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    proxyReq: () => {}
   * }
   * ```
   */
  onProxyReq?: (...args: any[]) => void; //httpProxy.ProxyReqCallback;
  /**
   * @deprecated
   * Use `on.proxyReqWs` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    proxyReqWs: () => {}
   * }
   * ```
   */
  onProxyReqWs?: (...args: any[]) => void; //httpProxy.ProxyReqWsCallback;
  /**
   * @deprecated
   * Use `on.open` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    open: () => {}
   * }
   * ```
   */
  onOpen?: (...args: any[]) => void; //httpProxy.OpenCallback;
  /**
   * @deprecated
   * Use `on.close` instead.
   *
   * @example
   * ```js
   * {
   *   on: {
   *    close: () => {}
   * }
   * ```
   */
  onClose?: (...args: any[]) => void; //httpProxy.CloseCallback;
  /**
   * @deprecated
   * Use `logger` instead.
   *
   * @example
   * ```js
   * {
   *  logger: console
   * }
   * ```
   */
  logProvider?: any;
  /**
   * @deprecated
   * Use `logger` instead.
   *
   * @example
   * ```js
   * {
   *  logger: console
   * }
   * ```
   */
  logLevel?: any;
}
