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
  const host = req.headers.host;
  const path = req.url;

  const hostAndPath = host + path;

  for (const [key] of Object.entries(table)) {
    if (containsPath(key)) {
      if(/^\//.test(key)) {
        if(path.startsWith(key)) {
          result = table[key];
          logger.debug('[HPM] Router table match path only : "%s"', key);
          break;
        }
      } else if (hostAndPath.indexOf(key) > -1) {
        // match 'localhost:3000/api'
        result = table[key];
        logger.debug('[HPM] Router table match host and path: "%s"', key);
        break;
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
