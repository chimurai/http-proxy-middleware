# Basic usage

This example will create a basic proxy middleware.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api', {target: 'http://localhost:3000'});
//                          \____/  \________________________________/
//                            |                     |
//                          context              options
```

## Alternative configuration

The proxy behavior of the following examples are **exactly** the same; Just different ways to configure it.

```javascript
app.use(proxy('/api', {target: 'http://localhost:3000', changeOrigin:true}));
```

```javascript
app.use(proxy('http://localhost:3000/api', {changeOrigin:true}));
```

```javascript
app.use('/api', proxy('http://localhost:3000', {changeOrigin:true}));
```

```javascript
app.use('/api', proxy({target: 'http://localhost:3000', changeOrigin:true}));
```
