import { getHandlers } from '../../src/_handlers';

// TODO: remove handlers
describe.skip('handlers factory', () => {
  let handlersMap;

  it('should return default handlers when no handlers are provided', () => {
    handlersMap = getHandlers(undefined);
    expect(typeof handlersMap.error).toBe('function');
  });

  describe('custom handlers', () => {
    beforeEach(() => {
      const fnCustom = () => {
        return 42;
      };

      const proxyOptions = {
        target: 'http://www.example.org',
        onError: fnCustom,
        onOpen: fnCustom,
        onClose: fnCustom,
        onProxyReq: fnCustom,
        onProxyReqWs: fnCustom,
        onProxyRes: fnCustom,
        onDummy: fnCustom,
        foobar: fnCustom,
      };

      handlersMap = getHandlers(proxyOptions);
    });

    it('should only return http-proxy handlers', () => {
      expect(typeof handlersMap.error).toBe('function');
      expect(typeof handlersMap.open).toBe('function');
      expect(typeof handlersMap.close).toBe('function');
      expect(typeof handlersMap.proxyReq).toBe('function');
      expect(typeof handlersMap.proxyReqWs).toBe('function');
      expect(typeof handlersMap.proxyRes).toBe('function');
      expect(handlersMap.dummy).toBeUndefined();
      expect(handlersMap.foobar).toBeUndefined();
      expect(handlersMap.target).toBeUndefined();
    });

    it('should use the provided custom handlers', () => {
      expect(handlersMap.error()).toBe(42);
      expect(handlersMap.open()).toBe(42);
      expect(handlersMap.close()).toBe(42);
      expect(handlersMap.proxyReq()).toBe(42);
      expect(handlersMap.proxyReqWs()).toBe(42);
      expect(handlersMap.proxyRes()).toBe(42);
    });
  });
});
