import type * as http from 'node:http';
import isGlob from 'is-glob';
import picomatch from 'picomatch';
import { ERRORS } from './errors.js';
import type { Filter } from './types.js';
 
export function matchPathFilter<TReq extends http.IncomingMessage = http.IncomingMessage>(
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
 
    throw new Error(ERRORS.ERR_CONTEXT_MATCHER_INVALID_ARRAY);
  }
 
  // custom matching
  if (typeof pathFilter === 'function') {
    const pathname = getUrlPathName(uri);
    return Boolean(pathFilter(pathname as string, req as TReq));
  }
 
  throw new Error(ERRORS.ERR_CONTEXT_MATCHER_GENERIC);
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
 * Matches a pathname against one or more glob patterns, applying negated
 * patterns (`!foo`) as exclusions rather than as alternatives.
 */
function isGlobMatch(pathname: string, pattern: string | string[]): boolean {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const negated = patterns.filter((p) => p.startsWith('!'));
  const positive = patterns.filter((p) => !p.startsWith('!'));
 
  const isIncluded = positive.length === 0 || picomatch.isMatch(pathname, positive);
  const isExcluded = negated.some((p) => !picomatch.isMatch(pathname, p));
 
  return isIncluded && !isExcluded;
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
