import type { Filter } from './types';
import * as isGlob from 'is-glob';
import * as micromatch from 'micromatch';
import * as url from 'url';
import { ERRORS } from './errors';
import type * as http from 'http';

export function matchPathFilter<TReq = http.IncomingMessage>(
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
    const stringPaths = pathFilter.filter(isStringPath);
    const globPaths = pathFilter.filter(isGlobPath);

    // Handle mixed arrays
    if (stringPaths.length && globPaths.length) {
      return (
        matchMultiPath(stringPaths, uri) ||
        matchMultiGlobPath(globPaths, uri)
      );
    }
    if (stringPaths.length) {
      return matchMultiPath(pathFilter, uri);
    }
    if (globPaths.length) {
      return matchMultiGlobPath(pathFilter, uri);
    }
    throw new Error(ERRORS.ERR_CONTEXT_MATCHER_INVALID_ARRAY);
  }

  // custom matching
  if (typeof pathFilter === 'function') {
    const pathname = getUrlPathName(uri) as string;
    return pathFilter(pathname, req as TReq);
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
  const pathname = getUrlPathName(uri) as string;
  const matches = micromatch([pathname], pattern);
  return matches && matches.length > 0;
}

function matchMultiGlobPath(patternList: string | string[], uri?: string) {
  return matchSingleGlobPath(patternList, uri);
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
  return uri && url.parse(uri).pathname;
}

function isStringPath(pathFilter: string) {
  return typeof pathFilter === 'string' && !isGlob(pathFilter);
}

function isGlobPath(pathFilter: string) {
  return isGlob(pathFilter);
}
