# Node deprecation warnings

Patch npm dependencies with:

- Use `patch-package` (<https://www.npmjs.com/package/patch-package>)
- Or with `pnpm`
  - <https://pnpm.io/cli/patch>
  - vite example: <https://github.com/vitejs/vite/pull/16655>

## `util._extend`

<https://github.com/chimurai/http-proxy-middleware/pull/1084>

```shell
[DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
```

## `punycode`

<https://github.com/chimurai/http-proxy-middleware/pull/1109>

```shell
[DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
```
