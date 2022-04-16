import isPlainObj = require('is-plain-obj');
import { Debug } from './debug';

const debug = Debug.extend('router');

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

  for (const [key, value] of Object.entries(table)) {
    if (containsPath(key)) {
      if (hostAndPath.indexOf(key) > -1) {
        // match 'localhost:3000/api'
        result = value;
        debug('match: "%s" -> "%s"', key, result);
        break;
      }
    } else {
      if (key === host) {
        // match 'localhost:3000'
        result = value;
        debug('match: "%s" -> "%s"', host, result);
        break;
      }
    }
  }

  return result;
}

function containsPath(v) {
  return v.indexOf('/') > -1;
}
