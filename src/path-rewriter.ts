import isPlainObj = require('is-plain-obj');
import { ERRORS } from './errors';
import { Debug } from './debug';

const debug = Debug.extend('path-rewriter');

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
        debug('rewriting path from "%s" to "%s"', path, result);
        break;
      }
    }

    return result;
  }
}

function isValidRewriteConfig(rewriteConfig) {
  if (typeof rewriteConfig === 'function') {
    return true;
  } else if (isPlainObj(rewriteConfig)) {
    return Object.keys(rewriteConfig).length !== 0;
  } else if (rewriteConfig === undefined || rewriteConfig === null) {
    return false;
  } else {
    throw new Error(ERRORS.ERR_PATH_REWRITER_CONFIG);
  }
}

function parsePathRewriteRules(rewriteConfig) {
  const rules = [];

  if (isPlainObj(rewriteConfig)) {
    for (const [key, value] of Object.entries(rewriteConfig)) {
      rules.push({
        regex: new RegExp(key),
        value: value,
      });
      debug('rewrite rule created: "%s" ~> "%s"', key, value);
    }
  }

  return rules;
}
