import { createProxyMiddleware } from '..';
import { Debug } from '../debug';
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
export function legacyCreateProxyMiddleware(shortHand: string): RequestHandler;
export function legacyCreateProxyMiddleware(legacyOptions: LegacyOptions): RequestHandler;
export function legacyCreateProxyMiddleware(
  legacyContext: Filter,
  legacyOptions: LegacyOptions
): RequestHandler;
export function legacyCreateProxyMiddleware(legacyContext, legacyOptions?): RequestHandler {
  debug('init');

  const options = legacyOptionsAdapter(legacyContext, legacyOptions);

  const proxyMiddleware = createProxyMiddleware(options);

  // https://github.com/chimurai/http-proxy-middleware/pull/731/files#diff-07e6ad10bda0df091b737caed42767657cd0bd74a01246a1a0b7ab59c0f6e977L118
  debug('add marker for patching req.url (old behavior)');
  (proxyMiddleware as any).__LEGACY_HTTP_PROXY_MIDDLEWARE__ = true;

  return proxyMiddleware;
}
