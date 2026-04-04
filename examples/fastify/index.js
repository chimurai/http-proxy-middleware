import fastifyExpress from '@fastify/express';
import fastifyFactory from 'fastify';
import open from 'open';

import { createProxyMiddleware } from '../../dist/index.js';

const fastify = fastifyFactory({ logger: true });

(async () => {
  await fastify.register(fastifyExpress);

  const proxy = createProxyMiddleware({
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true,
  });

  fastify.use(proxy);

  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) throw err;
    fastify.log.info(`server listening on ${address}`);

    open(`${address}/users`);
  });
})();
