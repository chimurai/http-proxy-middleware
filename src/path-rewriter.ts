import * as _ from 'lodash';
import { ERRORS } from './errors';
import { getInstance } from './logger';
const logger = getInstance();

/**
 * Create rewrite function, to cache parsed rewrite rules.
 *
 * @param {Object} rewriteConfig
 * @return {Function} Function to rewrite paths; This function should accept `path` (request.url) as parameter
 */
export function createPathRewriter(rewriteConfig) {
  let rulesCache;

  if (!isValidRewriteConfig(rewriteConfig)) {
    return;
  }

  if (typeof rewriteConfig === 'function') {
    const customRewriteFn = rewriteConfig;
    return customRewriteFn;
  } else {
    rulesCache = parsePathRewriteRules(rewriteConfig);
    return rewritePath;
  }

  function rewritePath(path) {
    let result = path;

    for (const rule of rulesCache) {
      if (rule.regex.test(path)) {
        result = result.replace(rule.regex, rule.value);
        logger.debug('[HPM] Rewriting path from "%s" to "%s"', path, result);
        break;
      }
    }

    return result;
  }
}

function isValidRewriteConfig(rewriteConfig) {
  if (typeof rewriteConfig === 'function') {
    return true;
  } else if (_.isPlainObject(rewriteConfig) && Object.keys(rewriteConfig).length !== 0) {
    return true;
  } else if (
    rewriteConfig === undefined ||
    rewriteConfig === null ||
    _.isEqual(rewriteConfig, {})
  ) {
    return false;
  } else {
    throw new Error(ERRORS.ERR_PATH_REWRITER_CONFIG);
  }
}

function parsePathRewriteRules(rewriteConfig) {
  const rules = [];

  if (_.isPlainObject(rewriteConfig)) {
    for (const [key] of Object.entries(rewriteConfig)) {
      rules.push({
        regex: new RegExp(key),
        value: rewriteConfig[key],
      });
      logger.info('[HPM] Proxy rewrite rule created: "%s" ~> "%s"', key, rewriteConfig[key]);
    }
  }

  return rules;
}
