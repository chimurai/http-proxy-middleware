import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

import { HttpsProxyAgent } from 'https-proxy-agent';
import { describe, expect, it } from 'vitest';

import { parseAgentName } from '../../../src/utils/parse-agent-name.js';

describe('parseAgentName()', () => {
  it.each([
    ['hostname', 'localhost:8080:', '8080'],
    ['IPv4 address', '127.0.0.1:8081:', '8081'],
    ['minimum port', 'localhost:0:', '0'],
    ['maximum port', 'localhost:65535:', '65535'],
    ['port with leading zeroes', 'localhost:0080:', '0080'],
    ['IPv6 loopback', '::1:8443:', '8443'],
    ['compressed IPv6 address', '2001:db8::1:8443:', '8443'],
    ['expanded IPv6 address', '2001:db8:0:0:0:0:0:1:8443:', '8443'],
    ['IPv6 address with zone', 'fe80::1%eth0:8443:', '8443'],
    ['HTTP local address and family', 'localhost:8080:127.0.0.1:4', '8080'],
    ['HTTPS options containing colons and numbers', 'localhost:443::cert:1234:value::::', '443'],
    ['same port at multiple IPv6 positions', '::1:80:80:', '80'],
  ])('extracts the port from a key with %s', (_description, key, expected) => {
    expect(parseAgentName(key)).toEqual({ port: expected });
  });

  it('parses keys produced by the Node HTTP agent', () => {
    const key = new HttpAgent().getName({
      host: 'example.com',
      port: 8080,
      localAddress: '127.0.0.1',
      family: 4,
    });

    expect(key).toBe('example.com:8080:127.0.0.1:4');
    expect(parseAgentName(key)).toEqual({ port: '8080' });
  });

  it('parses keys produced by the Node HTTPS agent', () => {
    const key = new HttpsAgent().getName({
      host: 'example.com',
      port: 8443,
      ca: 'certificate:1234:value',
    });

    expect(key).toBe('example.com:8443::certificate:1234:value:::::::::::::::::::');
    expect(parseAgentName(key)).toEqual({ port: '8443' });
  });

  it('parses keys produced by the HTTP HTTPS proxy agent', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: 'example.com',
      port: 8081,
      secureEndpoint: false,
    });

    expect(key).toBe('example.com:8081:');
    expect(parseAgentName(key)).toEqual({ port: '8081' });
  });

  it('parses keys produced by the HTTPS HTTPS proxy agent', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: 'example.com',
      port: 8444,
      secureEndpoint: true,
    });

    expect(key).toBe('example.com:8444:::::::::::::::::::::');
    expect(parseAgentName(key)).toEqual({ port: '8444' });
  });

  it('parses keys produced by the HTTPS proxy agent with certificates', () => {
    const key = new HttpsProxyAgent('https://proxy.example:3128', {
      ca: 'proxy-certificate:1234:value',
    }).getName({
      host: 'example.com',
      port: 8445,
      secureEndpoint: true,
      ca: 'target-certificate:1234:value',
    });

    expect(key).toBe('example.com:8445::target-certificate:1234:value:::::::::::::::::::');
    expect(parseAgentName(key)).toEqual({ port: '8445' });
  });

  it.each(['::1', '2001:db8::1'])('parses agent keys for IPv6 destination %s', (host) => {
    const httpKey = new HttpAgent().getName({ host, port: 8080 });
    const httpsKey = new HttpsAgent().getName({
      host,
      port: 8443,
      ca: 'certificate:1234:value',
    });
    const proxyHttpKey = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host,
      port: 8081,
      secureEndpoint: false,
    });
    const proxyHttpsKey = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host,
      port: 8444,
      secureEndpoint: true,
    });
    const proxyHttpsKeyWithCert = new HttpsProxyAgent('https://proxy.example:3128', {
      ca: 'proxy-certificate:1234:value',
    }).getName({
      host,
      port: 8445,
      secureEndpoint: true,
      ca: 'target-certificate:1234:value',
    });

    expect(parseAgentName(httpKey)).toEqual({ port: '8080' });
    expect(parseAgentName(httpsKey)).toEqual({ port: '8443' });
    expect(parseAgentName(proxyHttpKey)).toEqual({ port: '8081' });
    expect(parseAgentName(proxyHttpsKey)).toEqual({ port: '8444' });
    expect(parseAgentName(proxyHttpsKeyWithCert)).toEqual({ port: '8445' });
  });

  it('parses an HTTP proxy agent key for an IPv6 loopback destination', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: '::1',
      port: 8081,
      secureEndpoint: false,
    });

    expect(key).toBe('::1:8081:');
    expect(parseAgentName(key)).toEqual({ port: '8081' });
  });

  it('parses an HTTPS proxy agent key for an expanded IPv6 destination', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: '2001:db8:0:0:0:0:0:1',
      port: 8443,
      secureEndpoint: true,
    });

    expect(key).toBe('2001:db8:0:0:0:0:0:1:8443:::::::::::::::::::::');
    expect(parseAgentName(key)).toEqual({ port: '8443' });
  });

  it('parses an IPv6 destination key with an IPv4 local address and family', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: '2001:db8::1',
      port: 8444,
      localAddress: '192.0.2.10',
      family: 4,
      secureEndpoint: false,
    });

    expect(key).toBe('2001:db8::1:8444:192.0.2.10:4');
    expect(parseAgentName(key)).toEqual({ port: '8444' });
  });

  it('parses a zone-scoped IPv6 destination at the maximum port', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: 'fe80::1%eth0',
      port: 65535,
      secureEndpoint: false,
    });

    expect(key).toBe('fe80::1%eth0:65535:');
    expect(parseAgentName(key)).toEqual({ port: '65535' });
  });

  it('parses an IPv6 destination key when the proxy URL also uses IPv6', () => {
    const key = new HttpsProxyAgent('http://[2001:db8::3]:3128').getName({
      host: '2001:db8::1',
      port: 8446,
      secureEndpoint: true,
    });

    expect(key).toBe('2001:db8::1:8446:::::::::::::::::::::');
    expect(parseAgentName(key)).toEqual({ port: '8446' });
  });

  it('returns an undefined port for an IPv6 destination with port zero', () => {
    const key = new HttpsProxyAgent('http://proxy.example:3128').getName({
      host: '::1',
      port: 0,
      secureEndpoint: false,
    });

    expect(key).toBe('::1::');
    expect(parseAgentName(key)).toEqual({ port: undefined });
  });

  it.each([
    ['empty key', ''],
    ['missing host', ':8080:'],
    ['missing port', 'localhost::'],
    ['missing trailing separator', 'localhost:8080'],
    ['non-numeric port', 'localhost:http:'],
    ['negative port', 'localhost:-1:'],
    ['port above the valid range', 'localhost:65536:'],
    ['port longer than five digits', 'localhost:123456:'],
    ['invalid IPv6 prefix', 'not:ipv6:8080:'],
    ['different valid IPv6 port positions', '2001:db8::1:8443:1234:'],
    ['IPv6 destination with an ambiguous numeric local address', '2001:db8::1:8080:2001:db8::2'],
  ])('returns an undefined port for %s', (_description, key) => {
    expect(parseAgentName(key)).toEqual({ port: undefined });
  });
});
