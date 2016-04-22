### Expected behavior

### Actual behavior

### Setup

* http-proxy-middleware: _version_
* server: _connect/express/browser-sync..._ + _version_
* other relevant modules

#### proxy middleware configuration
```javascript
var apiProxy = proxy('/api', {target:'http://www.example.org', changeOrigin:true});
```
#### server mounting
```javascript
var app = express();

app.use(apiProxy);
app.listen(3000);
```
