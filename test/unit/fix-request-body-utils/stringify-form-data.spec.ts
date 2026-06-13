import { describe, expect, it } from 'vitest';

import { stringifyFormData } from '../../../src/handlers/fix-request-body-utils/stringify-form-data.js';

describe('stringifyFormData', () => {
  describe('boundary parsing', () => {
    it('should serialize using quoted boundary', () => {
      const result = stringifyFormData('multipart/form-data; boundary="BB"', { user: 'alice' });

      expect(result).toBe('--BB\r\nContent-Disposition: form-data; name="user"\r\n\r\nalice\r\n');
    });

    it('should serialize using unquoted boundary', () => {
      const result = stringifyFormData('multipart/form-data; boundary=BB', { user: 'alice' });

      expect(result).toBe('--BB\r\nContent-Disposition: form-data; name="user"\r\n\r\nalice\r\n');
    });

    it('should serialize using case-insensitive boundary parameter', () => {
      const result = stringifyFormData('multipart/form-data; BOUNDARY=BB', { user: 'alice' });

      expect(result).toBe('--BB\r\nContent-Disposition: form-data; name="user"\r\n\r\nalice\r\n');
    });

    it('should lock legacy fallback when boundary parameter is missing', () => {
      const contentType = 'multipart/form-data; charset=utf-8';

      const result = stringifyFormData(contentType, { user: 'alice' });

      expect(result).toBe(
        '--multipart/form-data; charset=utf-8\r\nContent-Disposition: form-data; name="user"\r\n\r\nalice\r\n',
      );
    });
  });

  describe('field serialization', () => {
    it('should escape field names and coerce values with String()', () => {
      // Input key includes a backslash + quote sequence: field\"name
      // Output escapes backslash first, then quote in Content-Disposition name.
      const result = stringifyFormData('multipart/form-data; boundary=BB', {
        'field\\"name': 42,
      });

      expect(result).toBe(
        '--BB\r\nContent-Disposition: form-data; name="field\\\\\\"name"\r\n\r\n42\r\n',
      );
    });

    it('should coerce null and undefined values with String()', () => {
      const result = stringifyFormData('multipart/form-data; boundary=BB', {
        nullValue: null,
        undefinedValue: undefined,
      });

      expect(result).toContain('name="nullValue"\r\n\r\nnull\r\n');
      expect(result).toContain('name="undefinedValue"\r\n\r\nundefined\r\n');
    });

    it('should serialize multiple fields in insertion order', () => {
      const result = stringifyFormData('multipart/form-data; boundary=BB', {
        first: '1',
        second: true,
      });

      expect(result).toBe(
        '--BB\r\nContent-Disposition: form-data; name="first"\r\n\r\n1\r\n' +
          '--BB\r\nContent-Disposition: form-data; name="second"\r\n\r\ntrue\r\n',
      );
    });
  });

  describe('security validation', () => {
    // RFC 9112 obsolete line folding guidance: reject CR/LF in multipart boundary and fields.
    it('should reject unsafe multipart boundary containing CRLF', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary="BB\r\nX-Injection: 1"', {
          user: 'alice',
        }),
      ).toThrow(
        '[HPM] unsafe multipart boundary detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart boundary containing CR only', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary="BB\rX"', { user: 'alice' }),
      ).toThrow(
        '[HPM] unsafe multipart boundary detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart boundary containing LF only', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary="BB\nX"', { user: 'alice' }),
      ).toThrow(
        '[HPM] unsafe multipart boundary detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart boundary when empty after trimming', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=   ', { user: 'alice' }),
      ).toThrow(
        '[HPM] unsafe multipart boundary detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart field names containing LF', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=BB', {
          'bad\nname': 'alice',
        }),
      ).toThrow(
        '[HPM] unsafe multipart field name "bad\nname" detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart field names containing CR', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=BB', {
          'bad\rname': 'alice',
        }),
      ).toThrow(
        '[HPM] unsafe multipart field name "bad\rname" detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart field values containing CRLF', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=BB', {
          user: 'alice\r\nadmin',
        }),
      ).toThrow(
        '[HPM] unsafe multipart field value for "user" detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart field values containing CR', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=BB', {
          user: 'alice\radmin',
        }),
      ).toThrow(
        '[HPM] unsafe multipart field value for "user" detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });

    it('should reject unsafe multipart field values containing boundary delimiter', () => {
      expect(() =>
        stringifyFormData('multipart/form-data; boundary=BB', {
          user: 'prefix --BB suffix',
        }),
      ).toThrow(
        '[HPM] unsafe multipart field value for "user" detected. Request rejected per RFC 9112 obsolete line folding guidance.',
      );
    });
  });
});
