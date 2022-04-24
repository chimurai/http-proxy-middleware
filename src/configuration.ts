import { ERRORS } from './errors';
import { Options } from './types';

export function verifyConfig<TReq, TRes>(options: Options<TReq, TRes>): void {
  if (!options.target && !options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }
}
