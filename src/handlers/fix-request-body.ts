import type * as http from 'http';
import type { Request } from '../types';
import * as querystring from 'querystring';

type HandleBadRequestArgs = {
  proxyReq: http.ClientRequest;
  req: http.IncomingMessage;
  res: http.ServerResponse;
};

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(
  proxyReq: http.ClientRequest,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const requestBody = (req as Request).body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;

  if (!contentType) {
    return;
  }

  // Handle bad request when unexpected "Connect: Upgrade" header is provided
  if (/upgrade/gi.test(proxyReq.getHeader('Connection') as string)) {
    handleBadRequest({ proxyReq, req, res });
    return;
  }

  // Handle bad request when invalid request body is provided
  if (hasInvalidKeys(requestBody)) {
    handleBadRequest({ proxyReq, req, res });
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

function hasInvalidKeys(obj) {
  return Object.keys(obj).some((key) => /[\n\r]/.test(key));
}

function handleBadRequest({ proxyReq, req, res }: HandleBadRequestArgs) {
  res.writeHead(400);
  res.end('Bad Request');
  proxyReq.destroy();
  req.destroy();
}
