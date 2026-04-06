import type * as http from 'node:http';

import type { ProxyServerOptions } from 'httpxy';
import isPlainObject from 'is-plain-obj';

import { Debug } from './debug.js';
import type { Options } from './index.js';

const debug = Debug.extend('router');

export async function getTarget<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
>(req: TReq, config: Options<TReq, TRes>) {
  let newTarget;
  const router = config.router;

  if (isPlainObject(router)) {
    newTarget = getTargetFromProxyTable(req, router);
  } else if (typeof router === 'function') {
    newTarget = await router(req);
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

function containsPath(v: string) {
  return v.indexOf('/') > -1;
}
