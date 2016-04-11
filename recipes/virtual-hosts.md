# Name-based Virtual Hosts

This example will create a basic proxy middleware for [virtual hosted sites](https://en.wikipedia.org/wiki/Virtual_hosting#Name-based).

When `changeOrigin` is set to `true`; Host [HTTP header](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Request_fields) will be set to match target's host.

The `changeOrigin` option is provided by [http-proxy](https://github.com/nodejitsu/node-http-proxy).

```javascript
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    changeOrigin:true
};

var apiProxy = proxy('/api', options);
```
