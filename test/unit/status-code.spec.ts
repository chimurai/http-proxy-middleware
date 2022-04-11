import { getStatusCode } from '../../src/status-code';

describe('getStatusCode', () => {
  const errorCodes = {
    HPE_INVALID_FOO: 502,
    HPE_INVALID_BAR: 502,
    ECONNREFUSED: 504,
    ECONNRESET: 504,
    ENOTFOUND: 504,
    ETIMEDOUT: 504,
    any: 500,
  };

  it('should return http status code from error code', () => {
    Object.entries(errorCodes).forEach(([errorCode, statusCode]) => {
      expect(getStatusCode(errorCode)).toBe(statusCode);
    });
  });
});
