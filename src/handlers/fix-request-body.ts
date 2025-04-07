import type * as http from 'http';
import type { Request } from '../types';
import * as querystring from 'querystring';

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(proxyReq: http.ClientRequest, req: http.IncomingMessage): void {
  const requestBody = (req as Request).body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;

  if (!contentType) {
    return;
  }

  const writeBody = (bodyData: string) => {
    // deepcode ignore ContentLengthInCode: bodyParser fix
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType.includes('application/json')) {
    writeBody(JSON.stringify(requestBody));
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    writeBody(querystring.stringify(requestBody));
  }
}
