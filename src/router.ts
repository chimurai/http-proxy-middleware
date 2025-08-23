import { isPlainObject } from 'is-plain-object';

import { Debug } from './debug';

const debug = Debug.extend('router');

export async function getTarget(req, config) {
  let newTarget;
  const router = config.router;

  if (isPlainObject(router)) {
    newTarget = getTargetFromProxyTable(req, router);
  } else if (typeof router === 'function') {
    newTarget = await router(req);
  }

  return newTarget;
}

function getTargetFromProxyTable(req, table) {
  const host = req.headers.host;
  const path = req.url;
  let hostMatch;

  for (const [key, value] of Object.entries(table)) {
    // host-only rule
    if (!containsPath(key)) {
      if (key === host) {
        hostMatch = value;
      }
      continue;
    }

    // If key starts with '/', it's a path-only rule.
    if (key.startsWith('/')) {
      if (path.startsWith(key)) {
        debug('path-only match: "%s" -> "%s"', key, value);
        return value;
      }
    }
    // If key contains a '/' but doesn't start with one, it's a host+path rule.
    else {
      const hostAndPath = host + path;
      if (hostAndPath.startsWith(key)) {
        debug('host+path match: "%s" -> "%s"', key, value);
        return value;
      }
    }
  }

  // If we finished the loop with no path-involved matches, use the host-only match.
  if (hostMatch) {
    debug('host-only fallback: "%s" -> "%s"', host, hostMatch);
  }
  return hostMatch;
}

function containsPath(v) {
  return v.indexOf('/') > -1;
}
