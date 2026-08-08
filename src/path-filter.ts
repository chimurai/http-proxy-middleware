import type * as http from 'node:http';

import isGlob from 'is-glob';
import picomatch from 'picomatch';

import { HttpProxyMiddlewareError } from './errors.js';
import type { Filter } from './types.js';

export function matchPathFilter<TReq extends http.IncomingMessage = http.IncomingMessage>(
  pathFilter: Filter<TReq> = '/',
  uri: string | undefined,
  req: http.IncomingMessage,
): boolean {
  // single path
  if (isStringPath(pathFilter as string)) {
    return matchSingleStringPath(pathFilter as string, uri);
  }

  // single glob path
  if (isGlobPath(pathFilter as string)) {
    return matchSingleGlobPath(pathFilter as unknown as string[], uri);
  }

  // multi path
  if (Array.isArray(pathFilter)) {
    if (pathFilter.every(isStringPath)) {
      return matchMultiPath(pathFilter, uri);
    }
    if (pathFilter.every(isGlobPath)) {
      return matchMultiGlobPath(pathFilter as string[], uri);
    }

    throw new HttpProxyMiddlewareError(
      '[HPM] Invalid pathFilter. Plain paths (e.g. "/api") can not be mixed with globs (e.g. "/api/**"). Expecting something like: ["/api", "/ajax"] or ["/api/**", "!**.html"].',
      'HPM_INVALID_PATH_FILTER_ARRAY_CONFIG',
    );
  }

  // custom matching
  if (typeof pathFilter === 'function') {
    const pathname = getUrlPathName(uri) as string;
    return Boolean(pathFilter(pathname, req as TReq));
  }

  throw new HttpProxyMiddlewareError(
    '[HPM] Invalid pathFilter. Expecting something like: "/api" or ["/api", "/ajax"]',
    'HPM_INVALID_PATH_FILTER_CONFIG',
  );
}

/**
 * @param  {String} pathFilter '/api'
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchSingleStringPath(pathFilter: string, uri?: string) {
  const pathname = getUrlPathName(uri);
  return pathname?.indexOf(pathFilter) === 0;
}

const matchers: Record<string, picomatch.Matcher> = Object.create(null);

function matchSingleGlobPath(pattern: string, uri?: string) {
  const pathname = getUrlPathName(uri) as string;
  const matcher = (matchers[pattern] ??= picomatch(pattern));
  return matcher(pathname);
}

// Borrowed from https://github.com/micromatch/micromatch/blob/8bd704ec0d9894693d35da425d827819916be920/index.js#L32
// Optimized for single path + multi patterns
function matchMultiGlobPath(patternList: string[], uri?: string) {
  const pathname = getUrlPathName(uri) as string;

  let omited = false;
  let kept = false;
  let hasPositive = false;

  for (const pattern of patternList) {
    const matcher = (matchers[pattern] ??= picomatch(pattern));
    const matched = matcher(pathname, true);

    const negated = matched.state.negated || matched.state.negatedExtglob;

    if (!negated) hasPositive = true;

    const match = negated ? !matched.isMatch : matched.isMatch;
    if (!match) continue;

    if (negated) {
      omited = true;
    } else {
      omited = false;
      kept = true;
    }
  }

  return (!hasPositive || kept) && !omited;
}

/**
 * @param  {String} pathFilterList ['/api', '/ajax']
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchMultiPath(pathFilterList: string[], uri?: string) {
  let isMultiPath = false;

  for (const context of pathFilterList) {
    if (matchSingleStringPath(context, uri)) {
      isMultiPath = true;
      break;
    }
  }

  return isMultiPath;
}

/**
 * Parses URI and returns RFC 3986 path
 *
 * @param  {String} uri from req.url
 * @return {String}     RFC 3986 path
 */
function getUrlPathName(uri?: string) {
  return uri && new URL(uri, 'http://0.0.0.0').pathname;
}

function isStringPath(pathFilter: string) {
  return typeof pathFilter === 'string' && !isGlob(pathFilter);
}

function isGlobPath(pathFilter: string) {
  return isGlob(pathFilter);
}
