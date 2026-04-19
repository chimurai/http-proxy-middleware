import { describe, expect, it } from 'vitest';

import type { Options } from '../../../src/types.js';
import { normalizeIPv6LiteralTargets } from '../../../src/utils/ipv6.js';

describe('normalizeIPv6Targets()', () => {
  it('should mutate the same options object', () => {
    const options: Options = {
      target: 'http://[::1]:8888/api?foo=bar',
    };

    const originalOptions = options;
    normalizeIPv6LiteralTargets(options);

    expect(options).toBe(originalOptions);
  });

  it('should normalize bracketed IPv6 target string without port into a target object', () => {
    const options: Options = {
      target: 'http://[::1]/api',
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.target).toEqual({
      hostname: '::1',
      pathname: '/api',
      port: '',
      protocol: 'http:',
      search: '',
    });
  });

  it('should normalize bracketed IPv6 target string into a target object', () => {
    const options: Options = {
      target: 'http://[::1]:8888/api?foo=bar',
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.target).toEqual({
      hostname: '::1',
      pathname: '/api',
      port: '8888',
      protocol: 'http:',
      search: '?foo=bar',
    });
  });

  it('should normalize bracketed IPv6 target URL into a target object', () => {
    const options: Options = {
      target: new URL('http://[::1]:8888/api'),
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.target).toEqual({
      hostname: '::1',
      pathname: '/api',
      port: '8888',
      protocol: 'http:',
      search: '',
    });
  });

  it('should normalize bracketed IPv6 forward string into a forward object', () => {
    const options: Options = {
      forward: 'http://[::1]:9999/',
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.forward).toEqual({
      hostname: '::1',
      pathname: '/',
      port: '9999',
      protocol: 'http:',
      search: '',
    });
  });

  it('should leave non-IPv6 string targets unchanged', () => {
    const options: Options = {
      target: 'http://127.0.0.1:8888/api',
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.target).toBe('http://127.0.0.1:8888/api');
  });

  it('should leave object targets unchanged', () => {
    const target: Options['target'] = {
      hostname: '::1',
      port: 8888,
      protocol: 'http:',
    };

    const options: Options = {
      target,
    };

    normalizeIPv6LiteralTargets(options);

    expect(options.target).toBe(target);
  });
});
