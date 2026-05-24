import type * as http from 'node:http';
import type * as https from 'node:https';
import type * as net from 'node:net';

import { type ProxyServer, createProxyServer } from 'httpxy';

import { verifyConfig } from './configuration.js';
import { Debug as debug } from './debug.js';
import { getPlugins } from './get-plugins.js';
import { getLogger } from './logger.js';
import { matchPathFilter } from './path-filter.js';
import { createPathRewriter } from './path-rewriter.js';
import { getTarget } from './router.js';
import type { Filter, Logger, Options, RequestHandler } from './types.js';
import { getFunctionName } from './utils/function.js';
import { normalizeIPv6LiteralTargets } from './utils/ipv6.js';

export class HttpProxyMiddleware<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
> {
  private wsInternalSubscribedServers = new WeakSet<http.Server | https.Server>();
  private activeServers = new Set<http.Server | https.Server>();
  private proxyOptions: Options<TReq, TRes>;
  private proxy: ProxyServer<TReq, TRes>;
  private pathRewriter: ReturnType<typeof createPathRewriter<TReq, TRes>>;
  private logger: Logger;

  constructor(options: Options<TReq, TRes>) {
    verifyConfig<TReq, TRes>(options);
    this.proxyOptions = options;
    this.logger = getLogger(options as unknown as Options);

    debug(`create proxy server`);
    this.proxy = createProxyServer({});

    this.registerPlugins(this.proxy, this.proxyOptions);

    this.pathRewriter = createPathRewriter<TReq, TRes>(this.proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    this.middleware.upgrade = (req, socket, head) => {
      const server = this.#getServer(req);

      if (server && !this.wsInternalSubscribedServers.has(server)) {
        this.handleUpgrade(req, socket, head);
      }
    };
  }

  #getServer(req: TReq): http.Server | https.Server | undefined {
    return (req.socket as net.Socket & { server?: http.Server | https.Server })?.server;
  }

  // https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this
  public middleware: RequestHandler<TReq, TRes> = (async (
    req: TReq,
    res: TRes,
    next?: (err?: unknown) => void,
  ) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      let activeProxyOptions: Options<TReq, TRes>;
      try {
        // Preparation Phase: Apply router and path rewriter.
        activeProxyOptions = await this.prepareProxyRequest(req, res);

        // [Smoking Gun] httpxy is inconsistent with error handling:
        // 1. If target is missing (here), it emits 'error' but returns a boolean (bypassing our catch/next).
        // 2. If a network error occurs (in proxy.web), it rejects the promise but SKIPS emitting 'error'.
        // We manually throw here to force Case 1 into the catch block so next(err) is called for Express.
        if (!activeProxyOptions.target && !activeProxyOptions.forward) {
          throw new Error('Must provide a proper URL as target');
        }
      } catch (err) {
        next?.(err);
        return;
      }

      try {
        // Proxying Phase: Handle the actual web request.
        debug(`proxy request to target: %O`, activeProxyOptions.target);
        await this.proxy.web(req, res, activeProxyOptions);
      } catch (err) {
        // Manually emit 'error' event because httpxy's promise-based API does not emit it automatically.
        // This is crucial for backward compatibility with HPM plugins (like error-response-plugin)
        // and custom listeners registered via the 'on: { error: ... }' option.
        this.proxy.emit('error', err as Error, req, res, activeProxyOptions.target);

        next?.(err);
      }
    } else {
      next?.();
    }

    /**
     * Get the server object to subscribe to server events;
     * 'upgrade' for websocket and 'close' for graceful shutdown
     */
    const server = this.#getServer(req);

    if (server && !this.activeServers.has(server)) {
      debug('registering server close listener');
      this.activeServers.add(server);

      server.on('close', () => {
        debug('server close signal received.');
        this.activeServers.delete(server);

        if (this.activeServers.size > 0) {
          debug(`proxy server not closed: ${this.activeServers.size} server(s) still active`);
          return;
        } else {
          debug('closing proxy server');
          this.proxy.close(() => debug('proxy server closed'));
        }
      });
    }

    if (this.proxyOptions.ws === true && server) {
      // use initial request to access the server object to subscribe to http upgrade event
      this.catchUpgradeRequest(server);
    }
  }) as RequestHandler;

  private registerPlugins(proxy: ProxyServer<TReq, TRes>, options: Options<TReq, TRes>) {
    const plugins = getPlugins<TReq, TRes>(options);
    plugins.forEach((plugin) => {
      debug(`register plugin: "${getFunctionName(plugin)}"`);
      plugin(proxy, options);
    });
  }

  private catchUpgradeRequest = (server: http.Server | https.Server) => {
    if (!this.wsInternalSubscribedServers.has(server)) {
      debug('subscribing to server upgrade event');
      server.on('upgrade', this.handleUpgrade);
      this.wsInternalSubscribedServers.add(server);
    }
  };

  private handleUpgrade = async (req: TReq, socket: net.Socket, head: Buffer) => {
    try {
      if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
        // No HTTP response object exists during WebSocket upgrades, so pass undefined.
        const activeProxyOptions = await this.prepareProxyRequest(req, undefined);
        await this.proxy.ws(req, socket, activeProxyOptions, head);
        debug('server upgrade event received. Proxying WebSocket');
      }
    } catch (err) {
      // This error does not include the URL as the fourth argument as we won't
      // have the URL if `this.prepareProxyRequest` throws an error.
      this.proxy.emit('error', err as Error, req, socket);
    }
  };

  /**
   * Determine whether request should be proxied.
   */
  private shouldProxy = (
    pathFilter: Filter<TReq> | undefined,
    req: http.IncomingMessage,
  ): boolean => {
    try {
      return matchPathFilter(pathFilter, req.url, req);
    } catch (err) {
      debug('Error: matchPathFilter() called with request url: ', `"${req.url}"`);
      this.logger.error(err);
      return false;
    }
  };

  /**
   * Apply option.router and option.pathRewrite
   * Order matters:
   *    Router uses original path for routing;
   *    NOT the modified path, after it has been rewritten by pathRewrite
   * @param {Object} req
   * @return {Object} proxy options
   */
  private prepareProxyRequest = async (req: TReq, res?: TRes) => {
    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, res, newProxyOptions);
    normalizeIPv6LiteralTargets(newProxyOptions);
    await this.applyPathRewrite(req, res, this.pathRewriter, newProxyOptions);

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: TReq, res: TRes | undefined, options: Options<TReq, TRes>) => {
    let newTarget;

    if (options.router) {
      newTarget = await getTarget(req, res, options);

      if (newTarget) {
        debug('router new target: "%s"', newTarget);
        options.target = newTarget;
      }
    }
  };

  // rewrite path
  private applyPathRewrite = async (
    req: TReq,
    res: TRes | undefined,
    pathRewriter: ReturnType<typeof createPathRewriter<TReq, TRes>>,
    options: Options<TReq, TRes>,
  ) => {
    if (req.url && pathRewriter) {
      const path = await pathRewriter(req.url, req, res, options);

      if (typeof path === 'string') {
        debug('pathRewrite new path: %s', path);
        req.url = path;
      } else {
        debug('pathRewrite: no rewritten path found: %s', req.url);
      }
    }
  };
}
