import * as url from 'url';
import { Filter, Options } from '..';
import { LegacyOptions } from './types';
import { Debug } from '../debug';

const debug = Debug.extend('legacy-options-adapter');

// https://github.com/chimurai/http-proxy-middleware/blob/7341704d0aa9d1606dfd37ebfdffddd34c894784/src/_handlers.ts#L20-L27
const proxyEventMap = {
  onError: 'error',
  onProxyReq: 'proxyReq',
  onProxyRes: 'proxyRes',
  onProxyReqWs: 'proxyReqWs',
  onOpen: 'open',
  onClose: 'close',
};

/**
 * Convert {@link LegacyOptions legacy Options} to new {@link Options}
 */
export function legacyOptionsAdapter(
  legacyContext: Filter | LegacyOptions,
  legacyOptions: LegacyOptions
): Options {
  let options: LegacyOptions;

  // https://github.com/chimurai/http-proxy-middleware/pull/716
  if (typeof legacyContext === 'string' && !!url.parse(legacyContext).host) {
    throw new Error(
      `Shorthand syntax is removed from legacyCreateProxyMiddleware().
      Please use "legacyCreateProxyMiddleware({ target: 'http://www.example.org' })" instead.`
    );
  }

  // detect old "context" argument and convert to "options.pathFilter"
  // https://github.com/chimurai/http-proxy-middleware/pull/722/files#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L4
  if (legacyContext && legacyOptions) {
    debug('map legacy context/filter to options.pathFilter');
    options = { ...legacyOptions, pathFilter: legacyContext as Filter };
  } else if (legacyContext && !legacyOptions) {
    options = { ...(legacyContext as Options) };
  }

  // map old event names to new event names
  // https://github.com/chimurai/http-proxy-middleware/pull/745/files#diff-c54113cf61ec99691748a3890bfbeb00e10efb3f0a76f03a0fd9ec49072e410aL48-L53
  Object.entries(proxyEventMap).forEach(([legacyEventName, proxyEventName]) => {
    if (options[legacyEventName]) {
      options.on = { ...options.on };
      options.on[proxyEventName] = options[legacyEventName];
      debug('map legacy event "%s" to "on.%s"', legacyEventName, proxyEventName);
    }
  });

  // map old logProvider to new logger
  // https://github.com/chimurai/http-proxy-middleware/pull/749
  const logProvider = options.logProvider && options.logProvider();
  const logLevel = options.logLevel;
  debug('legacy logLevel', logLevel);
  debug('legacy logProvider: %O', logProvider);

  if (typeof logLevel === 'string' && logLevel !== 'silent') {
    options.logger = logProvider;
    debug('map "logProvider" to "logger"');
  }

  return options;
}
