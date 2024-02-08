# Response Interceptor

Intercept responses from upstream with `responseInterceptor`. (Make sure to set `selfHandleResponse: true`)

Responses which are compressed with `brotli`, `gzip` and `deflate` will be decompressed automatically. Response will be made available as [`buffer`](https://nodejs.org/api/buffer.html) which you can manipulate.

## Replace text and change http status code

```js
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'http://www.example.com',
  changeOrigin: true, // for vhosted sites

  /**
   * IMPORTANT: avoid res.end being called automatically
   **/
  selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

  /**
   * Intercept response and replace 'Hello' with 'Teapot' with 418 http response status code
   **/
  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      res.statusCode = 418; // set different response status code

      const response = responseBuffer.toString('utf8');
      return response.replaceAll('Example', 'Teapot');
    }),
  },
});
```

## Log request and response

```javascript
const proxy = createProxyMiddleware({
  target: 'http://www.example.com',
  changeOrigin: true, // for vhosted sites

  selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      // log original request and proxied request info
      const exchange = `[DEBUG] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
      console.log(exchange); // [DEBUG] GET / -> http://www.example.com [200]

      // log complete response
      const response = responseBuffer.toString('utf8');
      console.log(response); // log response body

      return responseBuffer;
    }),
  },
});
```

## Manipulate JSON responses (application/json)

```javascript
const proxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true, // for vhosted sites

  selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      // detect json responses
      if (proxyRes.headers['content-type'] === 'application/json') {
        let data = JSON.parse(responseBuffer.toString('utf8'));

        // manipulate JSON data here
        data = Object.assign({}, data, { extra: 'foo bar' });

        // return manipulated JSON
        return JSON.stringify(data);
      }

      // return other content-types as-is
      return responseBuffer;
    }),
  },
});
```

## Manipulate image response

Example [Lenna](https://en.wikipedia.org/wiki/Lenna) image: <https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png>

Proxy and manipulate image (flip, sepia, pixelate).

[![Image of Lenna](../.github/docs/response-interceptor-lenna.png)](https://codesandbox.io/s/trusting-engelbart-03rjl)

Check [source code](https://codesandbox.io/s/trusting-engelbart-03rjl) on codesandbox.

Some working examples on <https://03rjl.sse.codesandbox.io>/[relative wikimedia image path]:

- Lenna - ([manipulated](https://03rjl.sse.codesandbox.io/wikipedia/en/7/7d/Lenna_%28test_image%29.png)) ([original](https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png)).
- Starry Night - ([manipulated](https://03rjl.sse.codesandbox.io/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1024px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg)) ([original](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1024px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg)).
- Mona Lisa - ([manipulated](https://03rjl.sse.codesandbox.io/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg)) ([original](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg)).

_You can just use any relative image path from <https://upload.wikimedia.org> and use the relative image path on <https://03rjl.sse.codesandbox.io> to see the manipulated image._

```javascript
const Jimp = require('jimp'); // use jimp library for image manipulation

const proxy = createProxyMiddleware({
  target: 'https://upload.wikimedia.org',
  changeOrigin: true, // for vhosted sites

  selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const imageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];

      // detect image responses
      if (imageTypes.includes(proxyRes.headers['content-type'])) {
        try {
          const image = await Jimp.read(responseBuffer);
          image.flip(true, false).sepia().pixelate(5);
          return image.getBufferAsync(Jimp.AUTO);
        } catch (err) {
          console.log('image processing error: ', err);
          return responseBuffer;
        }
      }

      return responseBuffer; // return other content-types as-is
    }),
  },
});

// http://localhost:3000/wikipedia/en/7/7d/Lenna\_%28test_image%29.png
```

## Manipulate response headers

```js
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'http://www.example.com',
  changeOrigin: true, // for vhosted sites

  /**
   * IMPORTANT: avoid res.end being called automatically
   **/
  selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

  /**
   * Intercept response and remove the
   **/
  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      res.removeHeader('content-security-policy'); // Remove the Content Security Policy header
      res.setHeader('HPM-Header', 'Intercepted by HPM'); // Set a new header and value
      return responseBuffer;
    }),
  },
});
```
