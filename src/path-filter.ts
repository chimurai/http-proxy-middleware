import type { Filter, Request } from './types';
import * as isGlob from 'is-glob';
import * as micromatch from 'micromatch';
import * as url from 'url';
import { ERRORS } from './errors';
import { getUrl } from './url';

/**
 * Express mutates `Request::url`, demanding special case
 * handling for this single field.
 * {@link https://github.com/expressjs/express/issues/4854}
 */

export function matchPathFilter(pathFilter: Filter = '/', req: Request): boolean {
  const url = getUrl(req);
  switch (typeof pathFilter) {
    case 'string':
      // single glob path
      if (isGlob(pathFilter)) {
        return matchSingleGlobPath(pathFilter, url);
      }
      // single path
      return matchSingleStringPath(pathFilter, url);
    // custom matching
    case 'function':
      return pathFilter(getUrlPathName(url), req);
    case 'object':
      // multi path
      if (Array.isArray(pathFilter)) {
        if (pathFilter.every(isStringPath)) {
          return matchMultiPath(pathFilter, url);
        }
        if (pathFilter.every((path) => isGlob(path))) {
          return matchMultiGlobPath(pathFilter, url);
        }
        throw new Error(ERRORS.ERR_CONTEXT_MATCHER_INVALID_ARRAY);
      }
    default:
      throw new Error(ERRORS.ERR_CONTEXT_MATCHER_GENERIC);
  }
}

/**
 * @param  {String} pathFilter '/api'
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchSingleStringPath(pathFilter: string, uri: string) {
  const pathname = getUrlPathName(uri);
  return pathname.indexOf(pathFilter) === 0;
}

function matchSingleGlobPath(pattern: string | string[], uri: string) {
  const pathname = getUrlPathName(uri);
  const matches = micromatch([pathname], pattern);
  return matches && matches.length > 0;
}

function matchMultiGlobPath(patternList: string | string[], uri: string) {
  return matchSingleGlobPath(patternList, uri);
}

/**
 * @param  {String} pathFilterList ['/api', '/ajax']
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchMultiPath(pathFilterList: string[], uri: string) {
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
function getUrlPathName(uri: string) {
  return uri && url.parse(uri).pathname;
}

function isStringPath(pathFilter: string) {
  return typeof pathFilter === 'string' && !isGlob(pathFilter);
}
