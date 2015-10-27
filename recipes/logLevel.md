# Log Level

Control the amount of logging of http-proxy-middleware.

Possible values:
* `debug`
* `info`
* `warn` (default)
* `error`
* `silent`

## Level: debug

Log everyting.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logLevel: 'debug'
};

var proxy = proxyMiddleware('/api', options);
```

## Level: silent

Suppress all logging.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logLevel: 'silent'
};

var proxy = proxyMiddleware('/api', options);
```
