# Log Provider

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
const winston = require('winston');
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  logProvider: function (provider) {
    return winston;
  },
};

const apiProxy = createProxyMiddleware(options);
```

## Winston

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging. Map the logging api if needed.

```javascript
const winston = require('winston');
const { createProxyMiddleware } = require('http-proxy-middleware');

const logProvider = function (provider) {
  return {
    log: winston.log,
    debug: winston.debug,
    info: winston.info,
    warn: winston.warn,
    error: winston.error,
  };
};

const options = {
  target: 'http://localhost:3000',
  logProvider: logProvider,
};

const apiProxy = createProxyMiddleware(options);
```

# Winston Multi Transport

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
const winston = require('winston');
const { createProxyMiddleware } = require('http-proxy-middleware');

const logProvider = function (provider) {
  const logger = new winston.Logger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'some-file.log' }),
    ],
  });

  return logger;
};

const options = {
  target: 'http://localhost:3000',
  logProvider: logProvider,
};

const apiProxy = createProxyMiddleware(options);
```
