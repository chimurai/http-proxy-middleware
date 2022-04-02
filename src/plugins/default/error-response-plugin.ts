import { getStatusCode } from '../../status-code';
import { Plugin, Response } from '../../types';

export const errorResponsePlugin: Plugin = (proxyServer, options) => {
  proxyServer.on('error', (err, req, res: Response, target?) => {
    // Re-throw error. Not recoverable since req & res are empty.
    if (!req && !res) {
      throw err; // "Error: Must provide a proper URL as target"
    }

    if (res.writeHead && !res.headersSent) {
      const statusCode = getStatusCode((err as unknown as any).code);
      res.writeHead(statusCode);
    }

    const host = req.headers && req.headers.host;
    res.end(`Error occurred while trying to proxy: ${host}${req.url}`);
  });
};
