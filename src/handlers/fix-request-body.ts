import { ClientRequest } from 'http';
import type { Request } from '../types';
import * as querystring from 'querystring';

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(proxyReq: ClientRequest, req: Request): void {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;
  const writeBody = (bodyData: string) => {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType.includes('application/json')) {
    writeBody(JSON.stringify(req.body));
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    writeBody(querystring.stringify(req.body));
  }
}
