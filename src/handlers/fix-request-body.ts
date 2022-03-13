import type * as http from 'http';
import type { Request } from '../types';
import * as querystring from 'querystring';

type BodyParserRequest = {
  body?: Record<string, any>;
};

/**
 * Fix proxied body if bodyParser is involved.
 *
 * {@link https://www.npmjs.com/package/body-parser}
 * {@link https://github.com/chimurai/http-proxy-middleware/pull/492}
 */
export function fixRequestBody(proxyReq: http.ClientRequest, req: Request): void {
  const requestBody = (req as BodyParserRequest).body;

  if (!requestBody) {
    return;
  }

  const contentTypeRaw = proxyReq.getHeader('Content-Type');
  const contentType = typeof contentTypeRaw === 'string' ? contentTypeRaw : null;
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
