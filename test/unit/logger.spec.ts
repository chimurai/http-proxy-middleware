import { getLogger } from '../../src/logger';

describe('Logger', () => {
  it('should return global "console" logger when configured in Options', () => {
    const logger = getLogger({ logger: console });
    expect(logger).toBe(console);
  });

  it('should return noop logger when not configured in Options', () => {
    const logger = getLogger({});
    expect(Object.keys(logger)).toMatchInlineSnapshot(`
      Array [
        "info",
        "warn",
        "error",
      ]
    `);
  });
});
