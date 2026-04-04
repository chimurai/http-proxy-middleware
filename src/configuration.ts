import type * as http from 'node:http';

import { ERRORS } from './errors';
import { Options } from './types';

export function verifyConfig<TReq extends http.IncomingMessage, TRes extends http.ServerResponse>(
  options: Options<TReq, TRes>,
): void {
  if (!options.target && !options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }
}
