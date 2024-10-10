import type { NextApiRequest, NextApiResponse } from 'next';
import { createProxyMiddleware } from '../../../../dist';

// Singleton
// prevent a new proxy being created for every request
export const proxyMiddleware = createProxyMiddleware<NextApiRequest, NextApiResponse>({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users',
  },
  logger: console,
});
