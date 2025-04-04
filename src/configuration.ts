import { ERRORS } from './errors';
import { Options } from './types';

export function verifyConfig<TReq, TRes>(options: Options<TReq, TRes>): void {
  if (!options.target && !options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }
  if (options.followRedirects && options.followRedirectsOpts) {
    if (
      (options.followRedirectsOpts.maxRedirects !== undefined &&
        options.followRedirectsOpts.maxRedirects <= 0) ||
      (options.followRedirectsOpts.maxBodyLength !== undefined &&
        options.followRedirectsOpts.maxBodyLength <= 0)
    ) {
      throw new Error(ERRORS.ERR_FOLLOW_REDIRECT_INVALID_OPTIONS);
    }
  }
}
