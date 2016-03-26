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
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logLevel: 'debug'
};

var apiProxy = proxy('/api', options);
```

## Level: silent

Suppress all logging.

```javascript
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logLevel: 'silent'
};

var apiProxy = proxy('/api', options);
```
