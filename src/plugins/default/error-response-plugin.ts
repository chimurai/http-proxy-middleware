import type * as http from 'node:http';
import type { Socket } from 'node:net';

import { getStatusCode } from '../../status-code.js';
import type { Plugin } from '../../types.js';
import { sanitize } from '../../utils/sanitize.js';
import { definePlugin } from '../define-plugin.js';

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
    // Log full details server-side where only admins can see them
  console.error(`Proxy error for ${req.headers.host || 'unknown host'}${req.url || 'unknown url'}:`, err);

    // Return generic error to client
    if (isResponseLike(res)) {
      if (!res.headersSent) {
        const statusCode = getStatusCode((err as unknown as any).code);
        res.writeHead(statusCode);
      }

      res.end('UPSTREAM_ERROR');
    } else if (isSocketLike(res)) {
      res.destroy();
    }
  });
});
