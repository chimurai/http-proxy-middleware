/**
 * Hono-specific API entrypoint.
 *
 * This is intentionally published as a dedicated subpath (`http-proxy-middleware/hono`)
 * so the root package types do not import `hono` / `@hono/node-server`.
 *
 * Keeping these exports out of the root entrypoint prevents non-Hono consumers from
 * getting TypeScript module-resolution errors for optional Hono dependencies.
 */
export { createHonoProxyMiddleware } from './factory-hono.js';
