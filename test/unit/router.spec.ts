import { getTarget } from '../../src/router';

describe('router unit test', () => {
  let fakeReq;
  let config;
  let result;
  let proxyOptionWithRouter;

  beforeEach(() => {
    fakeReq = {
      headers: {
        host: 'localhost',
      },
      url: '/',
    };

    config = {
      target: 'http://localhost:6000',
    };
  });

  describe('router.getTarget from function', () => {
    let request;

    beforeEach(() => {
      proxyOptionWithRouter = {
        target: 'http://localhost:6000',
        router(req) {
          request = req;
          return 'http://foobar.com:666';
        },
      };

      result = getTarget(fakeReq, proxyOptionWithRouter);
    });

    describe('custom dynamic router function', () => {
      it('should provide the request object for dynamic routing', () => {
        expect(request.headers.host).toBe('localhost');
        expect(request.url).toBe('/');
      });
      it('should return new target', () => {
        return expect(result).resolves.toBe('http://foobar.com:666');
      });
    });
  });

  describe('router.getTarget from async function', () => {
    let request;

    beforeEach(() => {
      proxyOptionWithRouter = {
        target: 'http://localhost:6000',
        async router(req) {
          request = req;
          return 'http://foobar.com:666';
        },
      };

      result = getTarget(fakeReq, proxyOptionWithRouter);
    });

    describe('custom dynamic router async function', () => {
      it('should provide the request object for dynamic routing', () => {
        expect(request.headers.host).toBe('localhost');
        expect(request.url).toBe('/');
      });
      it('should return new target', () => {
        return expect(result).resolves.toBe('http://foobar.com:666');
      });
    });
  });

  describe('router.getTarget from table', () => {
    beforeEach(() => {
      proxyOptionWithRouter = {
        target: 'http://localhost:6000',
        router: {
          'alpha.localhost': 'http://localhost:6001',
          'beta.localhost': 'http://localhost:6002',
          'gamma.localhost/api': 'http://localhost:6003',
          'gamma.localhost': 'http://localhost:6004',
          '/rest': 'http://localhost:6005',
          '/some/specific/path': 'http://localhost:6006',
          '/some': 'http://localhost:6007',
        },
      };
    });

    describe('without router config', () => {
      it('should return the normal target when router not present in config', () => {
        result = getTarget(fakeReq, config);
        return expect(result).resolves.toBeUndefined();
      });
    });

    describe('with just the host in router config', () => {
      it('should target http://localhost:6001 when for router:"alpha.localhost"', () => {
        fakeReq.headers.host = 'alpha.localhost';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6001');
      });

      it('should target http://localhost:6002 when for router:"beta.localhost"', () => {
        fakeReq.headers.host = 'beta.localhost';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6002');
      });
    });

    describe('with host and host + path config', () => {
      it('should target http://localhost:6004 without path', () => {
        fakeReq.headers.host = 'gamma.localhost';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6004');
      });

      it('should target http://localhost:6003 exact path match', () => {
        fakeReq.headers.host = 'gamma.localhost';
        fakeReq.url = '/api';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6003');
      });

      it('should target http://localhost:6004 when contains path', () => {
        fakeReq.headers.host = 'gamma.localhost';
        fakeReq.url = '/api/books/123';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6003');
      });
    });

    describe('with just the path', () => {
      it('should target http://localhost:6005 with just a path as router config', () => {
        fakeReq.url = '/rest';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6005');
      });

      it('should target http://localhost:6005 with just a path as router config', () => {
        fakeReq.url = '/rest/deep/path';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6005');
      });

      it('should target http://localhost:6000 path in not present in router config', () => {
        fakeReq.url = '/unknow-path';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBeUndefined();
      });
    });

    describe('matching order of router config', () => {
      it('should return first matching target when similar paths are configured', () => {
        fakeReq.url = '/some/specific/path';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6006');
      });
    });
        
    describe('matching order of router config', () => {
      it('should return another route key is use in url path configured', () => {
        fakeReq.url = '/some/rest/path';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });
    });
  });
});
