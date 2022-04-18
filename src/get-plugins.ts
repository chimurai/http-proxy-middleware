import type { Options, Plugin } from './types';
import {
  debugProxyErrorsPlugin,
  loggerPlugin,
  errorResponsePlugin,
  proxyEventsPlugin,
} from './plugins/default';

export function getPlugins(options: Options): Plugin[] {
  // don't load default errorResponsePlugin if user has specified their own
  const maybeErrorResponsePlugin = !!options.on?.error ? [] : [errorResponsePlugin];

  const defaultPlugins: Plugin[] = !!options.ejectPlugins
    ? [] // no default plugins when ejecting
    : [debugProxyErrorsPlugin, proxyEventsPlugin, loggerPlugin, ...maybeErrorResponsePlugin];
  const userPlugins: Plugin[] = options.plugins ?? [];
  return [...defaultPlugins, ...userPlugins];
}
