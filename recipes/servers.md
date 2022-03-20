# Servers

Overview of `http-proxy-middleware` implementation in different servers.

Missing a server? Feel free to extend this list of examples.

- [Express](#express)
- [Connect](#connect)
- [Next.js](#nextjs)
- [Browser-Sync](#browser-sync)
- [fastify](#fastify)
- [Polka](#polka)
- [lite-server](#lite-server)
- [grunt-contrib-connect](#grunt-contrib-connect)
- [gulp-connect](#gulp-connect)
- [grunt-browser-sync](#grunt-browser-sync)
- [gulp-webserver](#gulp-webserver)

## Express

https://github.com/expressjs/express
[![GitHub stars](https://img.shields.io/github/stars/expressjs/express.svg?style=social&label=Star)](https://github.com/expressjs/express)
![express downloads](https://img.shields.io/npm/dm/express)

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org/api',
  changeOrigin: true, // for vhosted sites
});

const app = express();

app.use('/api', apiProxy);
app.listen(3000);
```

## Connect

https://github.com/senchalabs/connect
[![GitHub stars](https://img.shields.io/github/stars/senchalabs/connect.svg?style=social&label=Star)](https://github.com/senchalabs/connect)
![connect downloads](https://img.shields.io/npm/dm/connect)

```javascript
const http = require('http');
const connect = require('connect');
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org/api',
  changeOrigin: true, // for vhosted sites
});

const app = connect();
app.use('/api', apiProxy);

http.createServer(app).listen(3000);
```

## Next.js

https://github.com/vercel/next.js
[![GitHub stars](https://img.shields.io/github/stars/vercel/next.js.svg?style=social&label=Star)](https://github.com/vercel/next.js)
![next.js downloads](https://img.shields.io/npm/dm/next)

Next project: `/pages/api/users.ts`

```typescript
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';

const proxyMiddleware = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users',
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  proxyMiddleware(req, res, (result: unknown) => {
    if (result instanceof Error) {
      throw result;
    }
  });
}

export const config = {
  api: {
    externalResolver: true,
  },
};

// curl http://localhost:3000/api/users
```

## Browser-Sync

https://github.com/BrowserSync/browser-sync
[![GitHub stars](https://img.shields.io/github/stars/BrowserSync/browser-sync.svg?style=social&label=Star)](https://github.com/BrowserSync/browser-sync)
![browser-sync downloads](https://img.shields.io/npm/dm/browser-sync)

```javascript
const browserSync = require('browser-sync').create();
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org',
  changeOrigin: true, // for vhosted sites
  pathFilter: '/api',
});

browserSync.init({
  server: {
    baseDir: './',
    port: 3000,
    middleware: [apiProxy],
  },
  startPath: '/api',
});
```

## fastify

https://github.com/fastify/fastify [![GitHub stars](https://img.shields.io/github/stars/fastify/fastify.svg?style=social&label=Star)](https://github.com/fastify/fastify)
![fastify downloads](https://img.shields.io/npm/dm/fastify)

```javascript
const fastify = require('fastify')({ logger: true });
const { createProxyMiddleware } = require('http-proxy-middleware');

(async () => {
  await fastify.register(require('fastify-express'));

  const proxy = createProxyMiddleware({
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true,
  });

  fastify.use(proxy);

  fastify.listen(3000, (err, address) => {
    if (err) throw err;
    fastify.log.info(`server listening on ${address}`);
  });
})();

// curl http://localhost:3000/users
```

## Polka

https://github.com/lukeed/polka
[![GitHub stars](https://img.shields.io/github/stars/lukeed/polka.svg?style=social&label=Star)](https://github.com/lukeed/polka)
![polka downloads](https://img.shields.io/npm/dm/polka)

```javascript
const polka = require('polka');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = polka();

app.use(
  createProxyMiddleware({
    target: 'http://www.example.org',
    changeOrigin: true,
  })
);

app.listen(3000);
```

## lite-server

https://github.com/johnpapa/lite-server
[![GitHub stars](https://img.shields.io/github/stars/johnpapa/lite-server.svg?style=social&label=Star)](https://github.com/johnpapa/lite-server)
![lite-server downloads](https://img.shields.io/npm/dm/lite-server)

File: `bs-config.js`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org',
  changeOrigin: true, // for vhosted sites
  pathFilter: '/api',
});

module.exports = {
  server: {
    // Start from key `10` in order to NOT overwrite the default 2 middleware provided
    // by `lite-server` or any future ones that might be added.
    // Reference: https://github.com/johnpapa/lite-server/blob/master/lib/config-defaults.js#L16
    middleware: {
      10: apiProxy,
    },
  },
};
```

## grunt-contrib-connect

https://github.com/gruntjs/grunt-contrib-connect
[![GitHub stars](https://img.shields.io/github/stars/gruntjs/grunt-contrib-connect.svg?style=social&label=Star)](https://github.com/gruntjs/grunt-contrib-connect)
![grunt-contrib-connect downloads](https://img.shields.io/npm/dm/grunt-contrib-connect)

As an `Array`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org',
  changeOrigin: true, // for vhosted sites
  pathFilter: '/api',
});

grunt.initConfig({
  connect: {
    server: {
      options: {
        middleware: [apiProxy],
      },
    },
  },
});
```

As a `function`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org',
  changeOrigin: true, // for vhosted sites
  pathFilter: '/api',
});

grunt.initConfig({
  connect: {
    server: {
      options: {
        middleware: function (connect, options, middlewares) {
          // inject a custom middleware into the array of default middlewares
          middlewares.unshift(apiProxy);

          return middlewares;
        },
      },
    },
  },
});
```

## gulp-connect

https://github.com/avevlad/gulp-connect
[![GitHub stars](https://img.shields.io/github/stars/avevlad/gulp-connect.svg?style=social&label=Star)](https://github.com/avevlad/gulp-connect)
![gulp-connect downloads](https://img.shields.io/npm/dm/gulp-connect)

```javascript
const gulp = require('gulp');
const connect = require('gulp-connect');
const { createProxyMiddleware } = require('http-proxy-middleware');

gulp.task('connect', function () {
  connect.server({
    root: ['./app'],
    middleware: function (connect, opt) {
      const apiProxy = createProxyMiddleware({
        target: 'http://www.example.org',
        changeOrigin: true, // for vhosted sites
        pathFilter: '/api',
      });

      return [apiProxy];
    },
  });
});

gulp.task('default', ['connect']);
```

## grunt-browser-sync

https://github.com/BrowserSync/grunt-browser-sync
[![GitHub stars](https://img.shields.io/github/stars/BrowserSync/grunt-browser-sync.svg?style=social&label=Star)](https://github.com/BrowserSync/grunt-browser-sync)
![grunt-browser-sync downloads](https://img.shields.io/npm/dm/grunt-browser-sync)

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://www.example.org',
  changeOrigin: true, // for vhosted sites
  pathFilter: '/api',
});

grunt.initConfig({
  // BrowserSync Task
  browserSync: {
    default_options: {
      options: {
        files: ['css/*.css', '*.html'],
        port: 9000,
        server: {
          baseDir: ['app'],
          middleware: apiProxy,
        },
      },
    },
  },
});
```

## gulp-webserver

https://github.com/schickling/gulp-webserver
[![GitHub stars](https://img.shields.io/github/stars/schickling/gulp-webserver.svg?style=social&label=Star)](https://github.com/schickling/gulp-webserver)
![gulp-webserver downloads](https://img.shields.io/npm/dm/gulp-webserver)

```javascript
const gulp = require('gulp');
const webserver = require('gulp-webserver');
const { createProxyMiddleware } = require('http-proxy-middleware');

gulp.task('webserver', function () {
  const apiProxy = createProxyMiddleware({
    target: 'http://www.example.org',
    changeOrigin: true, // for vhosted sites
    pathFilter: '/api',
  });

  gulp.src('app').pipe(
    webserver({
      livereload: true,
      directoryListing: true,
      open: true,
      middleware: [apiProxy],
    })
  );
});

gulp.task('default', ['webserver']);
```
