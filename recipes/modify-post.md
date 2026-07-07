## Modify POST body

Use `body-parser` to populate `req.body`, mutate that object in `on.proxyReq`, then call `fixRequestBody` so the updated body is written to the outgoing proxy request.

### Minimal example

```js
import express from 'express';
import bodyParser from 'body-parser';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

const app = express();

app.use(bodyParser.json());

app.use(
  '/search',
  createProxyMiddleware({
    target: 'http://localhost:4000',
    changeOrigin: true,
    on: {
      proxyReq(proxyReq, req) {
        if (req.method !== 'POST' || !req.body) {
          return;
        }

        // 1) modify the parsed body
        req.body.limit = 25;
        req.body.filters = ['public'];

        // 2) optional server-only header
        proxyReq.setHeader('x-api-key', process.env.SEARCH_API_KEY ?? '');

        // 3) write modified body to the proxied request
        fixRequestBody(proxyReq, req);
      },
    },
  }),
);
```

### Essential points

- If `body-parser` runs before the proxy, the original request stream has already been consumed.
- Updating `req.body` alone is not enough; call `fixRequestBody(proxyReq, req)` to forward the modified payload.
- Keep mutations in `proxyReq` focused on request shaping (fields/headers) and avoid unrelated app logic in this handler.
