import isPlainObj = require('is-plain-obj');
import { getInstance } from './logger';
const logger = getInstance();

export async function getTarget(req, config) {
  let newTarget;
  const router = config.router;

  if (isPlainObj(router)) {
    newTarget = getTargetFromProxyTable(req, router);
  } else if (typeof router === 'function') {
    newTarget = await router(req);
  }

  return newTarget;
}

function getTargetFromProxyTable(req, table) {
  let result;
  const host = req.headers.host || '';
  const path = req.url || '';

  for (const [key] of Object.entries(table)) {
    if (containsPath(key)) {
      if (isHostAndPathKey(key)) {
        const [keyHost, keyPath] = splitHostAndPathKey(key);

        // SECURITY: host+path keys must match exact host + path prefix.
        if (host === keyHost && path.startsWith(keyPath)) {
          // match 'localhost:3000/api'
          result = table[key];
          logger.debug('[HPM] Router table match: "%s"', key);
          break;
        }
      } else {
        if (path.startsWith(key)) {
          // match '/api'
          result = table[key];
          logger.debug('[HPM] Router table match: "%s"', key);
          break;
        }
      }
    } else {
      if (key === host) {
        // match 'localhost:3000'
        result = table[key];
        logger.debug('[HPM] Router table match: "%s"', host);
        break;
      }
    }
  }

  return result;
}

function containsPath(v) {
  return v.indexOf('/') > -1;
}

function isHostAndPathKey(v) {
  return containsPath(v) && !v.startsWith('/');
}

function splitHostAndPathKey(v) {
  const firstSlash = v.indexOf('/');
  return [v.slice(0, firstSlash), v.slice(firstSlash)];
}
