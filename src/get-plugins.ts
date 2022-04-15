import type { Options, Plugin } from './types';
import {
  debugProxyErrorsPlugin,
  loggerPlugin,
  errorResponsePlugin,
  proxyEventsPlugin,
} from './plugins/default';

export function getPlugins(options: Options): Plugin[] {
  const defaultPlugins: Plugin[] = !!options.ejectPlugins
    ? [] // no default plugins when ejecting
    : [debugProxyErrorsPlugin, proxyEventsPlugin, loggerPlugin, errorResponsePlugin];
  const userPlugins: Plugin[] = options.plugins ?? [];
  return [...defaultPlugins, ...userPlugins];
}
