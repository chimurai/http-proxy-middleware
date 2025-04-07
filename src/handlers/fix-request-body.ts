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

  if (!contentType) {
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
