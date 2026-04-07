/**
 * https://nodejs.org/api/packages.html#subpath-imports
 *
 * subpaths will look at the nearest package.json file.
 * importing from the parent dist folder is not allowed.
 * so we need to create a shim to re-export from parent file (../dist/index.js).
 * in the examples, we can import from '#http-proxy-middleware' instead of '../../dist/index.js'.
 **/
export * from '../dist/index.js';
