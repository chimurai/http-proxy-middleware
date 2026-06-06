import type * as http from 'node:http';

import type { ProxyServerOptions } from 'httpxy';
import isPlainObject from 'is-plain-obj';

import { Debug } from './debug.js';
import type { Options } from './index.js';

const debug = Debug.extend('router');

export async function getTarget<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
>(req: TReq, res: TRes | undefined, config: Options<TReq, TRes>) {
  let newTarget;
  const router = config.router;

  if (isPlainObject(router)) {
    newTarget = getTargetFromProxyTable(req, router);
  } else if (typeof router === 'function') {
    newTarget = await router(req, res, config);
  }

  return newTarget;
}

function getTargetFromProxyTable<TReq extends http.IncomingMessage>(
  req: TReq,
  table: Record<string, ProxyServerOptions['target']>,
) {
  let result;
  const host = req.headers.host ?? '';
  const path = req.url ?? '';

  for (const [key, value] of Object.entries(table)) {
    if (containsPath(key)) {
      if (isHostAndPathKey(key)) {
        const [keyHost, keyPath] = splitHostAndPathKey(key);

        // SECURITY: host+path keys must match exact host + path prefix.
        if (host === keyHost && path.startsWith(keyPath)) {
          // match 'localhost:3000/api'
          result = value;
          debug('match: "%s" -> "%s"', key, result);
          break;
        }
      } else {
        if (path.startsWith(key)) {
          // match '/api'
          result = value;
          debug('match: "%s" -> "%s"', key, result);
          break;
        }
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

function containsPath(v: string) {
  return v.indexOf('/') > -1;
}

function isHostAndPathKey(v: string) {
  return containsPath(v) && !v.startsWith('/');
}

function splitHostAndPathKey(v: string): [string, string] {
  const firstSlash = v.indexOf('/');
  return [v.slice(0, firstSlash), v.slice(firstSlash)];
}
