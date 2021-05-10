// file deepcode ignore DisablePoweredBy: testing purpose only
// file deepcode ignore UseCsurfForExpress: testing purpose only

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(
  createProxyMiddleware({
    target: 'https://jsonplaceholder.typicode.com',
    changeOrigin: true,
  })
);

module.exports = {
  app,
};
