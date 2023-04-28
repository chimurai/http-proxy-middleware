# Logger

Configure a logger to output information from http-proxy-middleware: ie. `console`, `winston`, `pino`, `bunyan`, `log4js`, etc...

## `console`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger: console,
  logLevel: 'debug',
});
```

## `winston`

<https://github.com/winstonjs/winston> ![GitHub Repo stars](https://img.shields.io/github/stars/winstonjs/winston?style=social) ![winston downloads](https://img.shields.io/npm/dm/winston)

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
const winston = require('winston');
const { format, transports } = require('winston');

// Enable interpolation in log messages
// https://github.com/winstonjs/winston#string-interpolation
const logger = winston.createLogger({
  format: format.combine(format.splat(), format.simple()),
  transports: [new transports.Console()],
});

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```

## `pino`

<https://github.com/pinojs/pino> ![GitHub Repo stars](https://img.shields.io/github/stars/pinojs/pino?style=social) ![winston downloads](https://img.shields.io/npm/dm/pino)

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
const pino = require('pino');

const logger = pino();

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```

## `log4js`

<https://github.com/log4js-node/log4js-node> ![GitHub Repo stars](https://img.shields.io/github/stars/log4js-node/log4js-node?style=social) ![winston downloads](https://img.shields.io/npm/dm/log4js)

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'debug';

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```

## `bunyan`

<https://github.com/trentm/node-bunyan> ![GitHub Repo stars](https://img.shields.io/github/stars/trentm/node-bunyan?style=social) ![winston downloads](https://img.shields.io/npm/dm/bunyan)

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'my-app',
});

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```
