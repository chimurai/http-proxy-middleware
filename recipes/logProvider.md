# Log Provider

Configure your own logger with the `logProvider` option.

In this example [winston](https://www.npmjs.com/package/winston) is configured to do the actual logging.

```javascript
var winston = require('winston');
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    logProvider: function (provider) {
        return winston;
    }
};

var proxy = proxyMiddleware('/api', options);
```
