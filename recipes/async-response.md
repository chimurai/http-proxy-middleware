# Async proxied response

Sometimes we need the ability to modify the response headers of the response of the proxied backend before sending it. For achieving it just make sure you have selfHandleResponse to true and add a pipe in the proxyRes:

```javascript

const myProxy = createProxyMiddleware({
  target: 'http://www.example.com',
  changeOrigin: true,
    selfHandleResponse: true,
    onProxyReq: (proxyReq, req, res) => {
      // before
      proxyReq.setHeader('mpth-1', 'da');
    },
    onProxyRes: async (proxyRes, req, res) => {

      const bar = await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({ 'wei': 'da' });
        }, 200);
      });

      // add your dynamic header
      res.setHeader('mpth-2', bar.wei);

      // now pipe the response
      proxyRes.pipe(res);

    }  
});

app.use(
  '/api',
  myProxy,
);
```

There are also cases where you need to modify the request header async, we can achieve this by applying middleware in front of the proxy. Like:



```javascript

const entryMiddleware = async (req,res,next) => {
  const foo = await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ 'da': 'da' });
    }, 200);
  });
  req.locals = {
    da: foo.da
  }
  next();
};

const myProxy = createProxyMiddleware({
  target: 'http://www.example.com',
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyReq: (proxyReq, req, res) => {
    // before
    // get something async from entry middlware before the proxy kicks in
    console.log('proxyReq:', req.locals.da);
    
    proxyReq.setHeader('mpth-1', req.locals.da);
  },
  onProxyRes: async (proxyRes, req, res) => {

    const bar = await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ 'wei': 'da' });
      }, 200);
    });

    // end:
    res.setHeader('mpth-2', bar.wei);

    proxyRes.pipe(res);

  }  
});


app.use(
  '/api',
  entryMiddleware,
  myProxy,
);
```
