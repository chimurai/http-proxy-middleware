import { describe, expect, it } from 'vitest';

import { type RequestWithPortInfo, getPorts } from '../../../src/utils/logger-plugin.js';

describe('getPorts()', () => {
  describe('when target request is defined', () => {
    it('should get the connected socket ports', () => {
      const request: RequestWithPortInfo = {
        agent: { sockets: { '127.0.0.1:8080:': [] } },
        socket: { remotePort: 9000 },
      };

      expect(getPorts(request)).toEqual({ remotePort: '9000', targetPort: '8080' });
    });
  });

  describe('when port data is missing', () => {
    it('should handle a missing request', () => {
      const request: RequestWithPortInfo | undefined = undefined;
      expect(getPorts(request)).toEqual({ remotePort: undefined, targetPort: undefined });
    });

    it('should handle missing request socket', () => {
      const request: RequestWithPortInfo = {};
      expect(getPorts(request)).toEqual({ remotePort: undefined, targetPort: undefined });
    });

    it('should handle a missing agent with a connected socket', () => {
      const request: RequestWithPortInfo = { agent: null, socket: { remotePort: 9000 } };
      expect(getPorts(request)).toEqual({ remotePort: '9000', targetPort: undefined });
    });
  });
});
