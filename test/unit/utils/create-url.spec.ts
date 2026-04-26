import { describe, expect, it } from 'vitest';

import { createUrl } from '../../../src/utils/create-url.js';

describe('createUrl()', () => {
  describe('happy paths', () => {
    it('should create a basic HTTP URL', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com', path: '/api' });
      expect(url.toString()).toBe('http://example.com/api');
    });

    it('should create an HTTPS URL', () => {
      const url = createUrl({ protocol: 'https:', host: 'example.com', path: '/secure' });
      expect(url.toString()).toBe('https://example.com/secure');
    });

    it('should include port when provided', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com', port: '3000', path: '/api' });
      expect(url.toString()).toBe('http://example.com:3000/api');
    });

    it('should default pathname to / when path is omitted', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com' });
      expect(url.toString()).toBe('http://example.com/');
    });

    it('should handle an IPv4 host', () => {
      const url = createUrl({
        protocol: 'http:',
        host: '127.0.0.1',
        port: '8080',
        path: '/health',
      });
      expect(url.toString()).toBe('http://127.0.0.1:8080/health');
    });

    it('should wrap an IPv6 localhost address in brackets', () => {
      const url = createUrl({ protocol: 'http:', host: '::1', port: '8080', path: '/' });
      expect(url.toString()).toBe('http://[::1]:8080/');
    });

    it('should wrap the IPv6 unspecified address in brackets', () => {
      const url = createUrl({ protocol: 'http:', host: '::', path: '/status' });
      expect(url.toString()).toBe('http://[::]/status');
    });

    it('should double-bracket an already-bracketed IPv6 host (pass-through behavior)', () => {
      // '[::1]' contains ':' so the function wraps it again → '[[::1]]', which is an invalid URL
      expect(() => createUrl({ protocol: 'http:', host: '[::1]', port: '9000' })).toThrow();
    });

    it('should handle a root path explicitly', () => {
      const url = createUrl({ protocol: 'http:', host: 'localhost', path: '/' });
      expect(url.toString()).toBe('http://localhost/');
    });

    it('should handle a deep nested path', () => {
      const url = createUrl({ protocol: 'http:', host: 'api.example.com', path: '/v1/users/42' });
      expect(url.toString()).toBe('http://api.example.com/v1/users/42');
    });
  });

  describe('edge cases — missing / undefined inputs', () => {
    it('should fall back gracefully when protocol is undefined', () => {
      const url = createUrl({ host: 'example.com', path: '/api' });
      expect(url.toString()).toBe('undefined://example.com/api');
    });

    it('should fall back gracefully when host is undefined', () => {
      const url = createUrl({ protocol: 'http:', path: '/api' });
      expect(url.toString()).toBe('http://[::]/api');
    });

    it('should fall back gracefully when both protocol and host are undefined (nock v13 scenario)', () => {
      const url = createUrl({ path: '/api' });
      expect(url.toString()).toBe('undefined://[::]/api');
    });

    it('should not set port when port is omitted', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com', path: '/no-port' });
      expect(url.toString()).toBe('http://example.com/no-port');
    });

    it('should not set pathname when path is omitted', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com' });
      expect(url.toString()).toBe('http://example.com/');
    });
  });

  describe('edge cases — empty string inputs', () => {
    it('should use fallback protocol when protocol is an empty string', () => {
      // empty string is falsy: fallback 'undefined:' is used
      const url = createUrl({ protocol: '', host: 'example.com', path: '/api' });
      expect(url.toString()).toBe('undefined://example.com/api');
    });

    it('should use fallback host when host is an empty string', () => {
      // empty string host → ipv6Host is '' (falsy) → fallback '[::]' used
      const url = createUrl({ protocol: 'http:', host: '', path: '/api' });
      expect(url.toString()).toBe('http://[::]/api');
    });

    it('should not set pathname when path is an empty string', () => {
      // empty string is falsy, so the `if (path)` branch is skipped
      const url = createUrl({ protocol: 'http:', host: 'example.com', path: '' });
      expect(url.toString()).toBe('http://example.com/');
    });

    it('should not set port when port is an empty string', () => {
      const url = createUrl({ protocol: 'http:', host: 'example.com', port: '', path: '/api' });
      expect(url.toString()).toBe('http://example.com/api');
    });
  });

  describe('edge cases — numeric port (runtime flexibility)', () => {
    it('should accept a numeric port value at runtime', () => {
      // type is string but runtime numeric values can occur; `url.port` coerces via assignment
      const url = createUrl({
        protocol: 'http:',
        host: 'example.com',
        port: 8080 as unknown as string,
      });
      expect(url.toString()).toBe('http://example.com:8080/');
    });
  });
});
