import type * as http from 'node:http';

import { HttpProxyMiddlewareError } from './errors.js';
import type { Options } from './types.js';

export function verifyConfig<TReq extends http.IncomingMessage, TRes extends http.ServerResponse>(
  options: Options<TReq, TRes>,
): void {
  if (!options.target && !options.router) {
    throw new HttpProxyMiddlewareError(
      '[HPM] Missing "target" option. Example: {target: "http://www.example.org"}',
      'ERR_CONFIG_FACTORY_TARGET_MISSING',
    );
  }
}
