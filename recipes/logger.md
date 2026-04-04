# Logger

Configure a logger to output information from http-proxy-middleware: ie. `console`, `winston`, `pino`, `bunyan`, `log4js`, etc...

## `console`

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger: console,
});
```

## `winston`

<https://github.com/winstonjs/winston> ![GitHub Repo stars](https://img.shields.io/github/stars/winstonjs/winston?style=social) ![winston downloads](https://img.shields.io/npm/dm/winston)

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as winston from 'winston';

const { format, transports } = winston;

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
import { createProxyMiddleware } from 'http-proxy-middleware';
import pino from 'pino';

const logger = pino();

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```

## `log4js`

<https://github.com/log4js-node/log4js-node> ![GitHub Repo stars](https://img.shields.io/github/stars/log4js-node/log4js-node?style=social) ![winston downloads](https://img.shields.io/npm/dm/log4js)

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';
import log4js from 'log4js';

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
import bunyan from 'bunyan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const logger = bunyan.createLogger({
  name: 'my-app',
});

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  logger,
});
```
