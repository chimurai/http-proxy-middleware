import type * as http from 'node:http';
import type { Socket } from 'node:net';

import { getStatusCode } from '../../status-code';
import { Plugin } from '../../types';
import { sanitize } from '../../utils/sanitize';

function isResponseLike(obj: any): obj is http.ServerResponse {
  return obj && typeof obj.writeHead === 'function';
}

function isSocketLike(obj: any): obj is Socket {
  return obj && typeof obj.write === 'function' && !('writeHead' in obj);
}

export const errorResponsePlugin: Plugin = (proxyServer, options) => {
  proxyServer.on('error', (err, req, res, target?) => {
    // Re-throw error. Not recoverable since req & res are empty.
    if (!req || !res) {
      throw err; // "Error: Must provide a proper URL as target"
    }

    if (isResponseLike(res)) {
      if (!res.headersSent) {
        const statusCode = getStatusCode((err as unknown as any).code);
        res.writeHead(statusCode);
      }

      const host = req.headers && req.headers.host;
      res.end(`Error occurred while trying to proxy: ${sanitize(host)}${sanitize(req.url)}`);
    } else if (isSocketLike(res)) {
      res.destroy();
    }
  });
};
