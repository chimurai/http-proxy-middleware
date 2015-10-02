# Log Provider - Winston Multi Transport

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
var winston = require('winston');
var proxyMiddleware = require("http-proxy-middleware");

var logProvider = function (provider) {
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'somefile.log' })
        ]
    });

    return logger;
};

var options = {
    target: 'http://localhost:3000',
    logProvider: logProvider
};

var proxy = proxyMiddleware('/api', options);
```
