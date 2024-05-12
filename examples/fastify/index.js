const fastify = require('fastify')({ logger: true });
const { createProxyMiddleware } = require('../../dist'); // require('http-proxy-middleware');

(async () => {
  await fastify.register(require('@fastify/express'));

  const proxy = createProxyMiddleware({
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true,
  });

  fastify.use(proxy);

  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) throw err;
    fastify.log.info(`server listening on ${address}`);

    require('open')(`${address}/users`);
  });
})();
