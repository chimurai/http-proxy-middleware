import { ERRORS } from './errors';
import { Options } from './types';

export function verifyConfig(options: Options): void {
  if (!options.target && !options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }
}
