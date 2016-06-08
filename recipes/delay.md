# Delay proxied request/response

Sometimes we need the ability to delay request to backend server or response from it back to client to test long execution time of particular url or all of them. With DevTool's [network throttling](https://developers.google.com/web/tools/chrome-devtools/profile/network-performance/network-conditions?hl=en) we can test slowdown of all request, not separately.
But we can handle each request individually via our proxy, and add delay to its execution time.

Let's assume that we want slow down the access to backend's `/api/get-me-something` resource. Delay request time by 2 seconds and increase response time by 5 seconds. 

For achieving it just put additional route handler to your app before proxy handler:

```javascript
const myProxy = proxy({
  target: 'http://www.example.com',
  changeOrigin: true
});
const proxyDelay = function (req, res, next) {
  if (req.originalUrl === '/api/get-me-something') {
    // Delay request by 2 seconds
    setTimeout(next, 2000);

    // Delay response completion by 5 seconds
    const endOriginal = res.end;
    res.end = function (...args) {
      setTimeout(function () {
        endOriginal.apply(res, args);
      }, 5000);
    };
  } else {
    next();
  }
};

app.use('/api', proxyDelay, myProxy);
```

And you will see result in devtools similar to this:

![http-proxy-delay](https://cloud.githubusercontent.com/assets/576077/15839924/49ebe256-2bfb-11e6-8591-ef0101670885.png)
