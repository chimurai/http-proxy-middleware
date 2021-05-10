# Why this test is needed

Testing purely with TypeScript doesn't cover this issue: https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this

https://github.com/chimurai/http-proxy-middleware/blob/c935888ea7135365bea3c4c81e4ffe48f359a670/src/http-proxy-middleware.ts#L45-L46

## npm package test

```shell
make clean install test
```

Create `http-proxy-middleware.tgz` package; install and test it locally with a simple use-case to
test for the TypeScript red-flag issue.
