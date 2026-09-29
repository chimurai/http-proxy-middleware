import type * as http from 'node:http';

import isGlob from 'is-glob';
import picomatch from 'picomatch';

import { HttpProxyMiddlewareError } from './errors.js';
import type { Filter } from './types.js';

export function matchPathFilter<
  TReq extends http.IncomingMessage = http.IncomingMessage,
>(
  pathFilter: Filter<TReq> | undefined = '/',
  uri: string | undefined,
  req: http.IncomingMessage,
): boolean {
  // single path
  if (isStringPath(pathFilter)) {
    return matchSingleStringPath(pathFilter as string, uri);
  }

  // single glob path
  if (isGlobPath(pathFilter)) {
    return matchSingleGlobPath(pathFilter as string, uri);
  }

  // multi path
  if (Array.isArray(pathFilter)) {
    if (pathFilter.every(isStringPath)) {
      return matchMultiPath(pathFilter, uri);
    }
    if (pathFilter.every(isGlobPath)) {
      return matchMultiGlobPath(pathFilter, uri);
    }

    throw new HttpProxyMiddlewareError(
      '[HPM] Invalid pathFilter. Plain paths (e.g. "/api") can not be mixed with globs (e.g. "/api/**"). Expecting something like: ["/api", "/ajax"] or ["/api/**", "!**.html"].',
      'HPM_INVALID_PATH_FILTER_ARRAY_CONFIG',
    );
  }

  // custom matching
  if (typeof pathFilter === 'function') {
    const pathname = getUrlPathName(uri);
    return Boolean(pathFilter(pathname as string, req as TReq));
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

function matchSingleGlobPath(pattern: string | string[], uri?: string) {
  const pathname = getUrlPathName(uri);
  return isGlobMatch(pathname as string, pattern);
}

function matchMultiGlobPath(patternList: string[], uri?: string) {
  return matchSingleGlobPath(patternList, uri);
}

/**
 * Matches a pathname against one or more glob patterns, preserving micromatch's
 * ordered include/exclude semantics: patterns are evaluated left-to-right, a
 * negated pattern (`!foo`) excludes a previously matched pathname, and a later
 * positive pattern can re-include it.
 */
function isGlobMatch(pathname: string, pattern: string | string[]): boolean {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const allNegated =
    patterns.length > 0 && patterns.every((p) => p.startsWith('!'));

  // when every pattern is negated, the baseline is "match everything"
  let kept = allNegated;
  let omitted = false;

  for (const p of patterns) {
    if (p.startsWith('!')) {
      if (picomatch.isMatch(pathname, p.slice(1))) {
        omitted = true;
      }
    } else if (picomatch.isMatch(pathname, p)) {
      kept = true;
      omitted = false;
    }
  }

  return kept && !omitted;
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

function isStringPath(pathFilter: unknown) {
  return typeof pathFilter === 'string' && !isGlob(pathFilter);
}

function isGlobPath(pathFilter: unknown) {
  return isGlob(pathFilter as string);
}
