import isPlainObj = require('is-plain-obj');
import { ERRORS } from './errors';
import { getInstance } from './logger';
import { Filter, Options } from './types';

const logger = getInstance();

export type Config = { context: Filter; options: Options };

export function createConfig(context, opts?: Options): Config {
  // structure of config object to be returned
  const config: Config = {
    context: undefined,
    options: {} as Options,
  };

  // app.use('/api', proxy({target:'http://localhost:9000'}));
  if (isContextless(context, opts)) {
    config.context = '/';
    config.options = Object.assign(config.options, context);

    // app.use('/api', proxy('http://localhost:9000'));
    // app.use(proxy('http://localhost:9000/api'));
  } else {
    config.context = context;
    config.options = Object.assign(config.options, opts);
  }

  configureLogger(config.options);

  if (!config.options.target && !config.options.router) {
    throw new Error(ERRORS.ERR_CONFIG_FACTORY_TARGET_MISSING);
  }

  return config;
}

/**
 * Checks if a Object only config is provided, without a context.
 * In this case the all paths will be proxied.
 *
 * @example
 *     app.use('/api', proxy({target:'http://localhost:9000'}));
 *
 * @param  {Object}  context [description]
 * @param  {*}       opts    [description]
 * @return {Boolean}         [description]
 */
function isContextless(context: Filter, opts: Options) {
  return isPlainObj(context) && (opts == null || Object.keys(opts).length === 0);
}

function configureLogger(options: Options) {
  if (options.logLevel) {
    logger.setLevel(options.logLevel);
  }

  if (options.logProvider) {
    logger.setProvider(options.logProvider);
  }
}
