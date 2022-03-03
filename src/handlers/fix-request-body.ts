import type * as http from 'http';
import type { Request } from '../types';
import * as querystring from 'querystring';

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(proxyReq: http.ClientRequest, req: Request): void {
  const requestBody = req.body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;
  const writeBody = (bodyData: string) => {
    // deepcode ignore ContentLengthInCode: bodyParser fix
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType && contentType.includes('application/json')) {
    writeBody(JSON.stringify(requestBody));
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    writeBody(querystring.stringify(requestBody));
  }
}
