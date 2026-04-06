import type { IncomingMessage } from 'node:http';

import isPlainObject from 'is-plain-obj';

import { Debug } from './debug.js';
import { ERRORS } from './errors.js';
import type { PathRewriteConfig } from './types.js';

const debug = Debug.extend('path-rewriter');

type RewriteRule = { regex: RegExp; value: string };

/**
 * Create rewrite function, to cache parsed rewrite rules.
 */
export function createPathRewriter<TReq extends IncomingMessage = IncomingMessage>(
  rewriteConfig: PathRewriteConfig<TReq> | undefined,
) {
  let rulesCache: RewriteRule[];

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

  function rewritePath(path: string) {
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

function isValidRewriteConfig<TReq extends IncomingMessage = IncomingMessage>(
  rewriteConfig: PathRewriteConfig<TReq> | undefined,
): boolean {
  if (typeof rewriteConfig === 'function') {
    return true;
  } else if (isPlainObject(rewriteConfig)) {
    return Object.keys(rewriteConfig).length !== 0;
  } else if (rewriteConfig === undefined || rewriteConfig === null) {
    return false;
  } else {
    throw new Error(ERRORS.ERR_PATH_REWRITER_CONFIG);
  }
}

function parsePathRewriteRules(rewriteConfig: PathRewriteConfig | undefined) {
  const rules: RewriteRule[] = [];

  if (isPlainObject(rewriteConfig)) {
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
