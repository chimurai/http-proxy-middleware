import type * as http from 'http';
import * as querystring from 'querystring';

import type { Options } from '../types';
import { getLogger } from '../logger';

export type BodyParserLikeRequest = http.IncomingMessage & { body?: any };

type HandleBadRequestArgs = {
  proxyReq: http.ClientRequest;
  req: BodyParserLikeRequest;
  res: http.ServerResponse<http.IncomingMessage>;
};

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody<TReq extends BodyParserLikeRequest = BodyParserLikeRequest>(
  proxyReq: http.ClientRequest,
  req: TReq,
  res: http.ServerResponse<http.IncomingMessage>,
  options: Options,
): void {
  const requestBody = req.body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;

  if (!contentType) {
    return;
  }

  const logger = getLogger(options);

  // Handle bad request when unexpected "Connect: Upgrade" header is provided
  if (/upgrade/gi.test(proxyReq.getHeader('Connection') as string)) {
    handleBadRequest({ proxyReq, req, res });
    logger.error(`[HPM] HPM_UNEXPECTED_CONNECTION_UPGRADE_HEADER. Aborted request: ${req.url}`);
    return;
  }

  // Handle bad request when invalid request body is provided
  if (hasInvalidKeys(requestBody)) {
    handleBadRequest({ proxyReq, req, res });
    logger.error(`[HPM] HPM_INVALID_REQUEST_DATA. Aborted request: ${req.url}`);
    return;
  }

  const writeBody = (bodyData: string) => {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  // Use if-elseif to prevent multiple writeBody/setHeader calls:
  // Error: "Cannot set headers after they are sent to the client"
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    writeBody(JSON.stringify(requestBody));
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    writeBody(querystring.stringify(requestBody));
  } else if (contentType.includes('multipart/form-data')) {
    writeBody(handlerFormDataBodyData(contentType, requestBody));
  }
}

/**
 * format FormData data
 * @param contentType
 * @param data
 * @returns
 */
function handlerFormDataBodyData(contentType: string, data: any) {
  const boundary = contentType.replace(/^.*boundary=(.*)$/, '$1');
  let str = '';
  for (const [key, value] of Object.entries(data)) {
    str += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
  }
  return str;
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
