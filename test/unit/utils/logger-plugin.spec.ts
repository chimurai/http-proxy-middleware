import { describe, expect, it } from 'vitest';

import { type RequestWithPortInfo, getPorts } from '../../../src/utils/logger-plugin.js';

describe('getPorts()', () => {
  describe('when target request is defined', () => {
    it('should get the port for the matching socket, not the first agent entry', () => {
      const socket = { remotePort: 9000 };
      const request = {
        host: 'unrelated.example',
        agent: {
          sockets: {
            '127.0.0.1:8080:': [{ remotePort: 8080 }],
            '127.0.0.1:8081:': [socket],
          },
        },
        socket,
      };

      expect(getPorts(request)).toEqual({ targetPort: '8081' });
    });

    it('should parse IPv6 and HTTPS agent keys with additional options', () => {
      const socket = { remotePort: 9000 };
      const request: RequestWithPortInfo = {
        agent: { sockets: { '::1:8443:::certificate:with:colons::::': [socket] } },
        socket,
      };

      expect(getPorts(request)).toEqual({ targetPort: '8443' });
    });
  });

  describe('when port data is missing', () => {
    it('should handle a missing request', () => {
      const request: RequestWithPortInfo | undefined = undefined;
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });

    it('should handle missing request socket', () => {
      const request: RequestWithPortInfo = {};
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });

    it('should handle a missing agent with a connected socket', () => {
      const request: RequestWithPortInfo = { agent: null, socket: { remotePort: 9000 } };
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });

    it('should not use an unrelated or unrecognized agent entry', () => {
      const socket = { remotePort: 9000 };
      const request: RequestWithPortInfo = {
        socket,
        agent: {
          sockets: {
            'localhost:8080:': [{ remotePort: 8080 }],
            'custom-agent-key': [socket],
          },
        },
      };
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });

    it('should ignore malformed ports in matching agent keys', () => {
      const socket = { remotePort: 9000 };
      const request: RequestWithPortInfo = {
        socket,
        agent: { sockets: { 'localhost:123456:': [socket] } },
      };
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });

    it('should not guess when an IPv6 agent key has multiple valid port positions', () => {
      const socket = { remotePort: 9000 };
      const request: RequestWithPortInfo = {
        socket,
        agent: { sockets: { '2001:db8::1:8443:1234:': [socket] } },
      };
      expect(getPorts(request)).toEqual({ targetPort: undefined });
    });
  });

  it.each([
    ['missing sockets property', {}],
    ['null sockets collection', { sockets: null }],
    ['missing socket entry', { sockets: { 'localhost:8080:': undefined } }],
    ['non-array socket entry', { sockets: { 'localhost:8080:': {} } }],
  ])('should safely handle an agent with a %s', (_description, agent) => {
    const request: RequestWithPortInfo = {
      agent,
      socket: { remotePort: 9000 },
    };

    expect(getPorts(request)).toEqual({ targetPort: undefined });
  });
});
