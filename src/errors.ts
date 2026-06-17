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
