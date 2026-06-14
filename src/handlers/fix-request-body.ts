import type * as http from 'node:http';
import * as querystring from 'node:querystring';
import * as zlib from 'node:zlib';

import { stringifyFormData } from './fix-request-body-utils/stringify-form-data.js';

export type BodyParserLikeRequest = http.IncomingMessage & { body?: any };

/**
 * Fix proxied body if bodyParser is involved.
 *
 * @example
 * ```ts
 * createProxyMiddleware({
 *   target: 'http://example.com',
 *   on: {
 *     proxyReq: fixRequestBody,
 *   }
 * });
 * ```
 *
 * Alternative solution without using `fixRequestBody()`: put `http-proxy-middleware` before `bodyParser` in the middleware stack.
 *
 * @see {@link https://github.com/chimurai/http-proxy-middleware/issues/40 Github issue #40 - POST request body is not proxied}
 */
export function fixRequestBody<TReq extends BodyParserLikeRequest = BodyParserLikeRequest>(
  proxyReq: http.ClientRequest,
  req: TReq,
): void {
  // skip fixRequestBody() when req.readableLength not 0 (bodyParser failure)
  if (req.readableLength !== 0) {
    return;
  }

  const requestBody = req.body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;

  if (!contentType) {
    return;
  }

  const writeBody = (bodyData: string) => {
    let proxyData: string | Buffer = bodyData;

    const contentEncoding = String(proxyReq.getHeader('Content-Encoding')).toLowerCase();
    switch (contentEncoding) {
      case 'br':
        proxyData = zlib.brotliCompressSync(proxyData);
        break;
      case 'deflate':
        proxyData = zlib.deflateSync(proxyData);
        break;
      case 'gzip':
        proxyData = zlib.gzipSync(proxyData);
        break;
      case 'zstd':
        proxyData = zlib.zstdCompressSync(proxyData);
        break;
    }

    proxyReq.setHeader('Content-Length', Buffer.byteLength(proxyData));
    proxyReq.write(proxyData);
  };

  try {
    // Use if-elseif to prevent multiple writeBody/setHeader calls:
    // Error: "Cannot set headers after they are sent to the client"
    if (contentType.includes('application/json') || contentType.includes('+json')) {
      writeBody(JSON.stringify(requestBody));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      writeBody(querystring.stringify(requestBody));
    } else if (contentType.includes('multipart/form-data')) {
      writeBody(stringifyFormData(contentType, requestBody));
    } else if (contentType.includes('text/plain')) {
      writeBody(requestBody);
    }
  } catch (error) {
    // proxyReq listeners run outside the middleware try/catch path; re-throwing here can bubble as
    // an unhandled exception in consumers, so destroy() is used to fail closed through proxy error handling.
    proxyReq.destroy(toError(error));
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
