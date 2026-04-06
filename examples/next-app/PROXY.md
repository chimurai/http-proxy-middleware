# Next.js + http-proxy-middleware

Minimal setup for using `http-proxy-middleware` with a Next.js Pages Router API route.

Reference: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

## Needed files

- `pages/api/_proxy.ts`
  Creates the shared `http-proxy-middleware` instance and defines the proxy target and any path rewrites.

- `pages/api/users.ts`
  Exposes the Next.js API route and passes requests to the shared proxy middleware.

## Route configuration

For the API route file:

- Set `api.externalResolver = true` so Next.js knows the response is handled by the proxy middleware.
- If proxied `POST`, `PUT`, or `PATCH` requests need the original request body stream, also set `api.bodyParser = false`.

In this example:

- Requests to `/api/users`
- are proxied to `http://jsonplaceholder.typicode.com/users`

## Start the server

From `examples/next-app`:

```sh
npm run dev
```

The Next.js dev server starts on `http://localhost:3000`.

## Test the proxy

Open this URL in a browser:

```text
http://localhost:3000/api/users
```

Or test it with `curl`:

```sh
curl http://localhost:3000/api/users
```

If the proxy is configured correctly, the response should come from the upstream `/users` endpoint on `jsonplaceholder.typicode.com`.
