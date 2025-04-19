import type * as http from 'http';

import { Debug } from '../debug';
import { createProxyMiddleware } from '../factory';
import { Filter, RequestHandler } from '../types';
import { legacyOptionsAdapter } from './options-adapter';
import { LegacyOptions } from './types';

const debug = Debug.extend('legacy-create-proxy-middleware');

/**
 * @deprecated
 * This function is deprecated and will be removed in a future version.
 *
 * Use {@link createProxyMiddleware} instead.
 */
export function legacyCreateProxyMiddleware<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
>(shortHand: string): RequestHandler<TReq, TRes>;
export function legacyCreateProxyMiddleware<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
>(legacyOptions: LegacyOptions<TReq, TRes>): RequestHandler<TReq, TRes>;
export function legacyCreateProxyMiddleware<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
>(
  legacyContext: Filter<TReq>,
  legacyOptions: LegacyOptions<TReq, TRes>,
): RequestHandler<TReq, TRes>;
export function legacyCreateProxyMiddleware<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
>(legacyContext, legacyOptions?): RequestHandler<TReq, TRes> {
  debug('init');

  const options = legacyOptionsAdapter<TReq, TRes>(legacyContext, legacyOptions);

  const proxyMiddleware = createProxyMiddleware<TReq, TRes>(options);

  // https://github.com/chimurai/http-proxy-middleware/pull/731/files#diff-07e6ad10bda0df091b737caed42767657cd0bd74a01246a1a0b7ab59c0f6e977L118
  debug('add marker for patching req.url (old behavior)');
  (proxyMiddleware as any).__LEGACY_HTTP_PROXY_MIDDLEWARE__ = true;

  return proxyMiddleware;
}
