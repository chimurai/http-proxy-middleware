import type { Options, Plugin } from './types';
import {
  debugProxyErrorsPlugin,
  loggerPlugin,
  errorResponsePlugin,
  proxyEventsPlugin,
} from './plugins/default';

export function getPlugins<TReq, TRes>(options: Options<TReq, TRes>): Plugin<TReq, TRes>[] {
  // don't load default errorResponsePlugin if user has specified their own
  const maybeErrorResponsePlugin = !!options.on?.error ? [] : [errorResponsePlugin];

  const defaultPlugins = !!options.ejectPlugins
    ? [] // no default plugins when ejecting
    : [debugProxyErrorsPlugin, proxyEventsPlugin, loggerPlugin, ...maybeErrorResponsePlugin];
  const userPlugins: Plugin<TReq, TRes>[] = options.plugins ?? [];
  return [...defaultPlugins, ...userPlugins] as unknown as Plugin<TReq, TRes>[];
}
