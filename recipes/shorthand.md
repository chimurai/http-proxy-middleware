# Shorthand

This example will create a proxy middleware using the shorthand notation.

The http-proxy-middleware `context` and `config.target` will be set automatically.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('http://localhost:3000/api');

// equivalent:
// var apiProxy = proxy('/api', {target:'http://localhost:3000'});
```

## Shorthand - Wildcard context

This example will create a proxy middleware with shorthand wildcard context.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('http://localhost:3000/api/books/*/**.json');
// equals:
// var apiProxy = proxy('/api/books/*/**.json', {target:'http://localhost:3000'});
```


## Shorthand with additional configuration

This example will create a proxy middleware with shorthand and additional configuration.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('http://localhost:3000/api', {changeOrigin: true});
// equals:
// var apiProxy = proxy('/api', {target:'http://localhost:3000', {changeOrigin:true}});
```

## Shorthand - WebSocket

This example will create a proxy middleware with shorthand and additional configuration for WebSocket support.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('http://localhost:3000/api', {ws: true});
// equals:
// var apiProxy = proxy('/api', {target:'http://localhost:3000', ws: true});
```

## Shorthand - WebSocket only

This example will create a proxy middleware with websocket shorthand only configuration.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('ws://localhost:3000/api');
// equals:
// var apiProxy = proxy('/api', {target:'ws://localhost:3000', ws: true});
```
