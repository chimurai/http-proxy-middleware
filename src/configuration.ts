import { ERRORS } from './errors';
import { getInstance } from './logger';
import { Options } from './types';

const logger = getInstance();

export function verifyConfig(options: Options): void {
  configureLogger(options);

  if (!options.target && !options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }
}

function configureLogger(options: Options): void {
  if (options.logLevel) {
    logger.setLevel(options.logLevel);
  }

  if (options.logProvider) {
    logger.setProvider(options.logProvider);
  }
}
