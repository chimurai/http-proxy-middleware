import { sanitize } from '../../../src/utils/sanitize';

describe('sanitize()', () => {
  it('should return empty string for undefined input', () => {
    expect(sanitize(undefined)).toEqual('');
  });

  it('should replace special characters with their HTML entity equivalents', () => {
    const input = '<>';
    expect(sanitize(input)).toMatchInlineSnapshot(`"%3C%3E"`);
  });

  it('should replace special characters with HTML entities', () => {
    const input = '<script>alert("XSS")</script>';
    expect(sanitize(input)).toMatchInlineSnapshot(`"%3Cscript%3Ealert("XSS")%3C/script%3E"`);
  });
});
