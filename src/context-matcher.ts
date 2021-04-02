import type { Filter, Request } from './types';
import * as isGlob from 'is-glob';
import * as micromatch from 'micromatch';
import * as url from 'url';
import { ERRORS } from './errors';

export function match(context: Filter, uri: string, req: Request): boolean {
  // single path
  if (isStringPath(context as string)) {
    return matchSingleStringPath(context as string, uri);
  }

  // single glob path
  if (isGlobPath(context as string)) {
    return matchSingleGlobPath(context as string[], uri);
  }

  // multi path
  if (Array.isArray(context)) {
    if (context.every(isStringPath)) {
      return matchMultiPath(context, uri);
    }
    if (context.every(isGlobPath)) {
      return matchMultiGlobPath(context as string[], uri);
    }

    throw new Error(ERRORS.ERR_CONTEXT_MATCHER_INVALID_ARRAY);
  }

  // custom matching
  if (typeof context === 'function') {
    const pathname = getUrlPathName(uri);
    return context(pathname, req);
  }

  throw new Error(ERRORS.ERR_CONTEXT_MATCHER_GENERIC);
}

/**
 * @param  {String} context '/api'
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchSingleStringPath(context: string, uri: string) {
  const pathname = getUrlPathName(uri);
  return pathname.indexOf(context) === 0;
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
 * @param  {String} contextList ['/api', '/ajax']
 * @param  {String} uri     'http://example.org/api/b/c/d.html'
 * @return {Boolean}
 */
function matchMultiPath(contextList: string[], uri: string) {
  let isMultiPath = false;

  for (const context of contextList) {
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

function isStringPath(context: string) {
  return typeof context === 'string' && !isGlob(context);
}

function isGlobPath(context: string) {
  return isGlob(context);
}
