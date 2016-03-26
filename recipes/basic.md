# Basic usage

This example will create a basic proxy middleware.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api', {target: 'http://localhost:3000'});
//                          \____/  \________________________________/
//                            |                     |
//                          context              options
```
