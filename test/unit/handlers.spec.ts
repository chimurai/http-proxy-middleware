import { getHandlers } from '../../src/_handlers';

describe('handlers factory', () => {
  let handlersMap;

  it('should return default handlers when no handlers are provided', () => {
    handlersMap = getHandlers(undefined);
    expect(typeof handlersMap.error).toBe('function');
    expect(typeof handlersMap.close).toBe('function');
  });

  describe('custom handlers', () => {
    beforeEach(() => {
      const fnCustom = () => {
        return 42;
      };

      const proxyOptions = {
        target: 'http://www.example.org',
        onError: fnCustom,
        onOpen: fnCustom,
        onClose: fnCustom,
        onProxyReq: fnCustom,
        onProxyReqWs: fnCustom,
        onProxyRes: fnCustom,
        onDummy: fnCustom,
        foobar: fnCustom,
      };

      handlersMap = getHandlers(proxyOptions);
    });

    it('should only return http-proxy handlers', () => {
      expect(typeof handlersMap.error).toBe('function');
      expect(typeof handlersMap.open).toBe('function');
      expect(typeof handlersMap.close).toBe('function');
      expect(typeof handlersMap.proxyReq).toBe('function');
      expect(typeof handlersMap.proxyReqWs).toBe('function');
      expect(typeof handlersMap.proxyRes).toBe('function');
      expect(handlersMap.dummy).toBeUndefined();
      expect(handlersMap.foobar).toBeUndefined();
      expect(handlersMap.target).toBeUndefined();
    });

    it('should use the provided custom handlers', () => {
      expect(handlersMap.error()).toBe(42);
      expect(handlersMap.open()).toBe(42);
      expect(handlersMap.close()).toBe(42);
      expect(handlersMap.proxyReq()).toBe(42);
      expect(handlersMap.proxyReqWs()).toBe(42);
      expect(handlersMap.proxyRes()).toBe(42);
    });
  });
});

describe('default proxy error handler', () => {
  const mockError = {
    code: 'ECONNREFUSED',
  };

  const mockReq = {
    headers: {
      host: 'localhost:3000',
    },
    url: '/api',
  };

  const proxyOptions = {
    target: {
      host: 'localhost.dev',
    },
  };

  let httpErrorCode;
  let errorMessage;

  const mockRes = {
    writeHead(v) {
      httpErrorCode = v;
      return v;
    },
    end(v) {
      errorMessage = v;
      return v;
    },
    headersSent: false,
  };

  let proxyError;

  beforeEach(() => {
    const handlersMap = getHandlers(undefined);
    proxyError = handlersMap.error;
  });

  afterEach(() => {
    httpErrorCode = undefined;
    errorMessage = undefined;
  });

  const codes = [
    ['HPE_INVALID_FOO', 502],
    ['HPE_INVALID_BAR', 502],
    ['ECONNREFUSED', 504],
    ['ENOTFOUND', 504],
    ['ECONNREFUSED', 504],
    ['ETIMEDOUT', 504],
    ['any', 500],
  ];

  codes.forEach((item) => {
    const msg = item[0];
    const code = item[1];
    it('should set the http status code for ' + msg + ' to: ' + code, () => {
      proxyError({ code: msg }, mockReq, mockRes, proxyOptions);
      expect(httpErrorCode).toBe(code);
    });
  });

  it('should end the response and return error message', () => {
    proxyError(mockError, mockReq, mockRes, proxyOptions);
    expect(errorMessage).toBe('Error occured while trying to proxy: localhost:3000/api');
  });

  it('should not set the http status code to: 500 if headers have already been sent', () => {
    mockRes.headersSent = true;
    proxyError(mockError, mockReq, mockRes, proxyOptions);
    expect(httpErrorCode).toBeUndefined();
  });

  it('should end the response and return error message', () => {
    mockRes.headersSent = true;
    proxyError(mockError, mockReq, mockRes, proxyOptions);
    expect(errorMessage).toBe('Error occured while trying to proxy: localhost:3000/api');
  });

  it('should re-throw error from http-proxy when target is missing', () => {
    mockRes.headersSent = true;
    const error = new Error('Must provide a proper URL as target');
    const fn = () => proxyError(error, undefined, undefined, proxyOptions);
    expect(fn).toThrowError(error);
  });
});
