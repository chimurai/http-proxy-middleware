import type * as http from 'http';
import * as querystring from 'querystring';

export type BodyParserLikeRequest = http.IncomingMessage & { body: any };

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody<TReq = http.IncomingMessage>(
  proxyReq: http.ClientRequest,
  req: TReq,
): void {
  const requestBody = (req as unknown as BodyParserLikeRequest).body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;
  const writeBody = (bodyData: string) => {
    // deepcode ignore ContentLengthInCode: bodyParser fix
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType && (contentType.includes('application/json') || contentType.endsWith('+json'))) {
    writeBody(JSON.stringify(requestBody));
  }

  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    writeBody(querystring.stringify(requestBody));
  }
}
