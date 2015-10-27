# onError

Subscribe to http-proxy's [error event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var onError = function (err, req, res) {
    console.log('Something went wrong.');
    console.log('And we are reporting a custom error message.');
};

var options = {target:'http://localhost:3000', onError: onError};

var proxy = proxyMiddleware('/api', options);
```
