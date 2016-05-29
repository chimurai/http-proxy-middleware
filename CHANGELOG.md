# Changelog

## [v0.15.2](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.15.2)
- fix(websocket): fixes websocket upgrade

## [v0.15.1](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.15.1)
- feat(pathRewrite): expose `req` object to pathRewrite function.
- fix(websocket): fixes websocket upgrade when both config.ws and external .upgrade() are used.

## [v0.15.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.15.0)
- feat(pathRewrite): support for custom pathRewrite function.

## [v0.14.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.14.0)
- feat(proxy): support proxy creation without context.
- fix(connect mounting): use connect's `path` configuration to mount proxy.

## [v0.13.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.13.0)
- feat(context): custom context matcher; when simple `path` matching is not sufficient.

## [v0.12.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.12.0)
- add option `onProxyReqWs` (subscribe to http-proxy `proxyReqWs` event)
- add option `onOpen` (subscribe to http-proxy `open` event)
- add option `onClose` (subscribe to http-proxy `close` event)

## [v0.11.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.11.0)
- improved logging

## [v0.10.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.10.0)
- feat(proxyTable) - added proxyTable support for WebSockets.
- fixed(proxyTable) - ensure original path (not rewritten path) is being used when `proxyTable` is used in conjunction with `pathRewrite`.

## [v0.9.1](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.9.1)
- fix server crash when socket error not handled correctly.

## [v0.9.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.9.0)
- support subscribing to http-proxy `proxyReq` event ([trbngr](https://github.com/trbngr))
- add `logLevel` and `logProvider` support

## [v0.8.2](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.8.2)
- fix proxyError handler ([mTazelaar](https://github.com/mTazelaar))

## [v0.8.1](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.8.1)
- fix pathRewrite when `agent` is configured

## [v0.8.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.8.0)
- support external websocket upgrade
- fix websocket shorthand

## [v0.7.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.7.0)
- support shorthand syntax
- fix express/connect mounting

## [v0.6.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.6.0)
- support proxyTable

## [v0.5.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.5.0)
- support subscribing to http-proxy `error` event
- support subscribing to http-proxy `proxyRes` event

## [v0.4.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.4.0)
- support websocket

## [v0.3.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.3.0)
- support wildcard / glob

## [v0.2.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.2.0)
- support multiple paths

## [v0.1.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.1.0)
- support path rewrite
- deprecate proxyHost option

## [v0.0.5](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.0.5)
- initial release
