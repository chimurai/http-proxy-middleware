import type * as http from 'http';
import type * as express from 'express';
import type { Request } from '../types';
import * as querystring from 'querystring';

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(proxyReq: http.ClientRequest, req: Request): void {
  const requestBody = (req as Request<express.Request>).body;

  if (!requestBody) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;
  const writeBody = (bodyData: string) => {
    // deepcode ignore ContentLengthInCode: bodyParser fix
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  const handlerFormDataBodyData = (
    contentType: string,
    data: any
  ) => {
    const boundary = contentType.replace(/^.*boundary=(.*)$/, "$1");
    let str = "";
    for (const [key, value] of Object.entries(data)) {
      str += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    return str;
  };

  if (contentType && contentType.includes('application/json')) {
    writeBody(JSON.stringify(requestBody));
  }

  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    writeBody(querystring.stringify(requestBody));
  }

  if (contentType && contentType.includes("multipart/form-data")) {
    writeBody(handlerFormDataBodyData(contentType, req.body));
  }
}
