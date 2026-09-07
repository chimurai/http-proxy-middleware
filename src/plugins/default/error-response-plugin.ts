import type * as http from 'node:http';
import type { Socket } from 'node:net';

import { getStatusCode } from '../../status-code.js';
import type { Plugin } from '../../types.js';
import { definePlugin } from '../define-plugin.js';

function getHtmlErrorTemplate(statusCode: number): string {
  return `<html>
  <body style="text-align: center;">
      <h1>HTTP ${statusCode} error</h1>
      <hr />
      <p>http-proxy-middleware</p>
  </body>
</html>`;
}

function isResponseLike(obj: any): obj is http.ServerResponse {
  return obj && typeof obj.writeHead === 'function';
}

function isSocketLike(obj: any): obj is Socket {
  return obj && typeof obj.write === 'function' && !('writeHead' in obj);
}

export const errorResponsePlugin: Plugin = definePlugin((proxyServer, options) => {
  proxyServer.on('error', (err, req, res, target?) => {
    // Re-throw error. Not recoverable since req & res are empty.
    if (!req || !res) {
      throw err; // "Error: Must provide a proper URL as target"
    }

    if (isResponseLike(res)) {
      const statusCode = getStatusCode((err as unknown as any).code);

      if (!res.headersSent) {
        res.writeHead(statusCode, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        });
      }

      res.end(getHtmlErrorTemplate(statusCode));
    } else if (isSocketLike(res)) {
      res.destroy();
    }
  });
});
