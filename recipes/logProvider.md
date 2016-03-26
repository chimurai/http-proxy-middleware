# Log Provider

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
var winston = require('winston');
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logProvider: function (provider) {
        return winston;
    }
};

var apiProxy = proxy('/api', options);
```

## Winston

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging. Map the logging api if needed.

```javascript

var winston = require('winston');
var proxy = require("http-proxy-middleware");

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

var apiProxy = proxy('/api', options);
```

# Winston Multi Transport

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
var winston = require('winston');
var proxy = require("http-proxy-middleware");

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

var apiProxy = proxy('/api', options);
```
