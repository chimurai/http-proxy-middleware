# Log Provider - Winston

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript

var winston = require('winston');
var proxyMiddleware = require("http-proxy-middleware");

var logProvider = function (provider) {
    return {
        log   : winston.log,
        debug : winston.debug,
        info  : winston.info,
        warn  : winston.warn,
        error : winston.error
    };
};

var options = {
    target: 'http://localhost:3000',
    logProvider: logProvider
};

var proxy = proxyMiddleware('/api', options);
```
