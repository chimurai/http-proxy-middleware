import fastifyExpress from '@fastify/express';
import fastifyFactory from 'fastify';
import open from 'open';

import { createProxyMiddleware } from '#http-proxy-middleware';

const fastify = fastifyFactory({ logger: true });

await fastify.register(fastifyExpress);

const proxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true,
});

fastify.use(proxy);

const address = await fastify.listen({ host: '127.0.0.1', port: 3000 });

fastify.log.info(`server listening on ${address}`);

open(`${address}/users`);
