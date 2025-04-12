import { Logger, Options } from './types';

/**
 * Compatibility matrix
 *
  | Library  |  log  |  info  | warn  |  error  | \<interpolation\> |
  |----------|:------|:-------|:------|:--------|:------------------|
  | console  |   ✅   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | bunyan   |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | pino     |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | winston  |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)^1 |
  | log4js   |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
 *
 * ^1: https://github.com/winstonjs/winston#string-interpolation
 */
const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

function isLogger(obj: any): obj is Logger {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.info === 'function' &&
    typeof obj.warn === 'function' &&
    typeof obj.error === 'function'
  );
}

export function getLogger(options: Options): Logger {
  const { logger } = options;

  if (logger === undefined) {
    return noopLogger;
  }

  if (!isLogger(logger)) {
    console.warn(
      '[http-proxy-middleware] Invalid logger provided. Falling back to default noopLogger.'
    );
    return noopLogger;
  }

  return logger;
}
