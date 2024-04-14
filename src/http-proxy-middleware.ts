import type * as net from 'net';
import type * as http from 'http';
import type * as https from 'https';
import type { RequestHandler, Options, Filter } from './types';
import * as httpProxy from 'http-proxy';
import { verifyConfig } from './configuration';
import { getPlugins } from './get-plugins';
import { matchPathFilter } from './path-filter';
import * as PathRewriter from './path-rewriter';
import * as Router from './router';
import { Debug as debug } from './debug';
import { getFunctionName } from './utils/function';

export class HttpProxyMiddleware<TReq, TRes> {
  private wsInternalSubscribed = false;
  private serverOnCloseSubscribed = false;
  private proxyOptions: Options<TReq, TRes>;
  private proxy: httpProxy<TReq, TRes>;
  private pathRewriter;

  constructor(options: Options<TReq, TRes>) {
    verifyConfig<TReq, TRes>(options);
    this.proxyOptions = options;

    debug(`create proxy server`);
    this.proxy = httpProxy.createProxyServer({});

    this.registerPlugins(this.proxy, this.proxyOptions);

    this.pathRewriter = PathRewriter.createPathRewriter(this.proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    this.setFollowRedirectOptions(options);

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    this.middleware.upgrade = (req, socket, head) => {
      if (!this.wsInternalSubscribed) {
        this.handleUpgrade(req, socket, head);
      }
    };
  }

  // https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this
  public middleware: RequestHandler = (async (req, res, next?) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      try {
        const activeProxyOptions = await this.prepareProxyRequest(req);
        debug(`proxy request to target: %O`, activeProxyOptions.target);
        this.proxy.web(req, res, activeProxyOptions);
      } catch (err) {
        next && next(err);
      }
    } else {
      next && next();
    }

    /**
     * Get the server object to subscribe to server events;
     * 'upgrade' for websocket and 'close' for graceful shutdown
     *
     * NOTE:
     * req.socket: node >= 13
     * req.connection: node < 13 (Remove this when node 12/13 support is dropped)
     */
    const server: https.Server = ((req.socket ?? req.connection) as any)?.server;

    if (server && !this.serverOnCloseSubscribed) {
      server.on('close', () => {
        debug('server close signal received: closing proxy server');
        this.proxy.close();
      });
      this.serverOnCloseSubscribed = true;
    }

    if (this.proxyOptions.ws === true) {
      // use initial request to access the server object to subscribe to http upgrade event
      this.catchUpgradeRequest(server);
    }
  }) as RequestHandler;

  private registerPlugins(proxy: httpProxy<TReq, TRes>, options: Options<TReq, TRes>) {
    const plugins = getPlugins<TReq, TRes>(options);
    plugins.forEach((plugin) => {
      debug(`register plugin: "${getFunctionName(plugin)}"`);
      plugin(proxy, options);
    });
  }

  /**
   Sets follow-redirects module global options used internally by http-proxy. When followRedirects is true, http-proxy uses the http and https agents of the follow-redirects module https://github.com/http-party/node-http-proxy/blob/9b96cd725127a024dabebec6c7ea8c807272223d/lib/http-proxy/passes/web-incoming.js#L105
  */
  private setFollowRedirectOptions = (options: Options<TReq, TRes>) => {
    if (!options.followRedirectsOpts) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const followRedirects = require('follow-redirects'); // Since there is no way to access the module from http-proxy and also given that http-proxy is unmaintained.
    if (!followRedirects) {
      return;
    }
    // Sets follow-redirects global options according to https://github.com/follow-redirects/follow-redirects?tab=readme-ov-file#global-options
    // This is a workaround, the options are set globally, ideally follow redirect options should be set through the http-proxy.
    if (options.followRedirectsOpts.maxRedirects) {
      followRedirects.maxRedirects = options.followRedirectsOpts.maxRedirects;
      debug('set followRedirects.maxRedirects globally', followRedirects.maxRedirects);
    }
    if (options.followRedirectsOpts.maxBodyLength) {
      followRedirects.maxBodyLength = options.followRedirectsOpts.maxBodyLength;
      debug('set followRedirects.maxBodyLength globally', followRedirects.maxBodyLength);
    }
  };

  private catchUpgradeRequest = (server: https.Server) => {
    if (!this.wsInternalSubscribed) {
      debug('subscribing to server upgrade event');
      server.on('upgrade', this.handleUpgrade);
      // prevent duplicate upgrade handling;
      // in case external upgrade is also configured
      this.wsInternalSubscribed = true;
    }
  };

  private handleUpgrade = async (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      const activeProxyOptions = await this.prepareProxyRequest(req);
      this.proxy.ws(req, socket, head, activeProxyOptions);
      debug('server upgrade event received. Proxying WebSocket');
    }
  };

  /**
   * Determine whether request should be proxied.
   */
  private shouldProxy = (
    pathFilter: Filter<TReq> | undefined,
    req: http.IncomingMessage,
  ): boolean => {
    return matchPathFilter(pathFilter, req.url, req);
  };

  /**
   * Apply option.router and option.pathRewrite
   * Order matters:
   *    Router uses original path for routing;
   *    NOT the modified path, after it has been rewritten by pathRewrite
   * @param {Object} req
   * @return {Object} proxy options
   */
  private prepareProxyRequest = async (req: http.IncomingMessage) => {
    /**
     * Incorrect usage confirmed: https://github.com/expressjs/express/issues/4854#issuecomment-1066171160
     * Temporary restore req.url patch for {@link src/legacy/create-proxy-middleware.ts legacyCreateProxyMiddleware()}
     * FIXME: remove this patch in future release
     */
    if ((this.middleware as unknown as any).__LEGACY_HTTP_PROXY_MIDDLEWARE__) {
      req.url = (req as unknown as any).originalUrl || req.url;
    }

    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, newProxyOptions);
    await this.applyPathRewrite(req, this.pathRewriter);

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: http.IncomingMessage, options: Options<TReq, TRes>) => {
    let newTarget;

    if (options.router) {
      newTarget = await Router.getTarget(req, options);

      if (newTarget) {
        debug('router new target: "%s"', newTarget);
        options.target = newTarget;
      }
    }
  };

  // rewrite path
  private applyPathRewrite = async (req: http.IncomingMessage, pathRewriter) => {
    if (pathRewriter) {
      const path = await pathRewriter(req.url, req);

      if (typeof path === 'string') {
        debug('pathRewrite new path: %s', req.url);
        req.url = path;
      } else {
        debug('pathRewrite: no rewritten path found: %s', req.url);
      }
    }
  };
}
