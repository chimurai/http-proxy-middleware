import { describe, expect, it } from 'vitest';

import { type TargetRequest, getPort } from '../../../src/utils/logger-plugin.js';

describe('getPort()', () => {
  describe('when target request is defined', () => {
    it('should get the connected socket port', () => {
      const request: TargetRequest = {
        socket: { remotePort: 9000 },
      };

      expect(getPort(request)).toBe('9000');
    });
  });

  describe('when port data is missing', () => {
    it('should handle a missing request', () => {
      const request: TargetRequest | undefined = undefined;
      expect(getPort(request)).toBeUndefined();
    });

    it('should handle missing request socket', () => {
      const request: TargetRequest = {};
      expect(getPort(request)).toBeUndefined();
    });
  });
});
