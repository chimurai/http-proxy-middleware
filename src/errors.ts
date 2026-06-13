export enum ERRORS {
  ERR_CONFIG_FACTORY_TARGET_MISSING = '[HPM] Missing "target" option. Example: {target: "http://www.example.org"}',
  ERR_CONTEXT_MATCHER_GENERIC = '[HPM] Invalid pathFilter. Expecting something like: "/api" or ["/api", "/ajax"]',
  ERR_CONTEXT_MATCHER_INVALID_ARRAY = '[HPM] Invalid pathFilter. Plain paths (e.g. "/api") can not be mixed with globs (e.g. "/api/**"). Expecting something like: ["/api", "/ajax"] or ["/api/**", "!**.html"].',
  ERR_PATH_REWRITER_CONFIG = '[HPM] Invalid pathRewrite config. Expecting object with pathRewrite config or a rewrite function',
}

export class HttpProxyMiddlewareError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);

    // add custom `code` property
    // so this can be used in src/plugins/default/error-response-plugin.ts to determine the status code to return
    this.code = code;

    // set the correct name for the error class
    this.name = this.constructor.name;

    // maintain proper stack trace (V8 environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
