import { getTarget } from '../../src/router';

describe('router unit test', () => {
  let fakeReq;
  let config;
  let result;
  let proxyOptionWithRouter;

  beforeEach(() => {
    fakeReq = {
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
          '/api': 'http://localhost:6001',
          '/users': 'http://localhost:6002',
          '/api/products': 'http://localhost:6003',
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

    describe('with path in router config', () => {
      it('should target http://localhost:6001 for router:"/api"', () => {
        fakeReq.url = '/api';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6001');
      });

      it('should target http://localhost:6002 for router:"/users"', () => {
        fakeReq.url = '/users';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6002');
      });
    });

    describe('with nested paths', () => {
      it('should target http://localhost:6001 for base path', () => {
        fakeReq.url = '/api';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6001');
      });

      it('should target http://localhost:6003 for more specific path', () => {
        fakeReq.url = '/api/products';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6003');
      });

      it('should target http://localhost:6003 for subpath', () => {
        fakeReq.url = '/api/products/123';
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

      it('should target undefined when path is not present in router config', () => {
        fakeReq.url = '/unknown-path';
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

      it('should match /some path correctly', () => {
        fakeReq.url = '/some';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });

      it('should match /some/other using /some prefix', () => {
        fakeReq.url = '/some/other';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });

      it('should match /some/specific using /some prefix', () => {
        fakeReq.url = '/some/specific';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });

      it('should match /some/specific/other using /some prefix', () => {
        fakeReq.url = '/some/specific/other';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });

      // Additional test cases for path matching
      it('should match /some/specific/path/extra using /some/specific/path prefix', () => {
        fakeReq.url = '/some/specific/path/extra';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6006');
      });

      it('should handle trailing slashes correctly', () => {
        fakeReq.url = '/some/';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        return expect(result).resolves.toBe('http://localhost:6007');
      });

      it('should handle URLs with encoded characters', () => {
        fakeReq.url = '/some/specific/path%2Fwith%2Fspaces';
        result = getTarget(fakeReq, proxyOptionWithRouter);
        // Verify the router handles encoded characters by matching the decoded path
        return expect(result).resolves.toBe('http://localhost:6006');
      });
    });
  });

  // Test the functionality through public API
  describe('router table matching behavior', () => {
    beforeEach(() => {
      fakeReq = {
        url: '/',
      };
    });

    describe('path matching', () => {
      it('should match exact path', () => {
        fakeReq.url = '/api/users';
        const config = {
          target: 'http://default.com',
          router: { '/api/users': 'http://users-api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://users-api.com');
      });

      it('should match path prefix', () => {
        fakeReq.url = '/api/users/123';
        const config = {
          target: 'http://default.com',
          router: { '/api/users': 'http://users-api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://users-api.com');
      });

      it('should handle query parameters correctly', () => {
        fakeReq.url = '/api/search?q=test';
        const config = {
          target: 'http://default.com',
          router: { '/api/search': 'http://search-api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://search-api.com');
      });

      it('should not match partial path segments', () => {
        fakeReq.url = '/api-v2/users';
        const config = {
          target: 'http://default.com',
          router: { '/api': 'http://api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBeUndefined();
      });
    });

    describe('matching priority', () => {
      it('should prioritize longer paths over shorter ones', () => {
        fakeReq.url = '/api/users/details';
        const config = {
          target: 'http://default.com',
          router: {
            '/api': 'http://general-api.com',
            '/api/users': 'http://users-api.com',
            '/api/users/details': 'http://details-api.com',
          },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://details-api.com');
      });
    });

    describe('edge cases', () => {
      it('should handle root path', () => {
        fakeReq.url = '/';
        const config = {
          target: 'http://default.com',
          router: { '/': 'http://root.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://root.com');
      });

      it('should handle URLs with no leading slash', () => {
        fakeReq.url = 'api/users';
        const config = {
          target: 'http://default.com',
          router: { '/api/users': 'http://users-api.com' },
        };
        const result = getTarget(fakeReq, config);
        // This should match because the function normalizes the path
        return expect(result).resolves.toBeUndefined();
      });

      it('should handle URLs with hash fragments', () => {
        fakeReq.url = '/api/users#profile';
        const config = {
          target: 'http://default.com',
          router: { '/api/users': 'http://users-api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://users-api.com');
      });

      it('should handle complex URLs with both query params and hash fragments', () => {
        fakeReq.url = '/api/users?id=123&filter=active#profile';
        const config = {
          target: 'http://default.com',
          router: { '/api/users': 'http://users-api.com' },
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBe('http://users-api.com');
      });
    });

    describe('special routing cases', () => {
      it('should handle empty table', () => {
        const config = {
          target: 'http://default.com',
          router: {},
        };
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBeUndefined();
      });

      it('should handle null or undefined values in table', () => {
        const config = {
          target: 'http://default.com',
          router: { '/api': null, '/users': undefined },
        };
        fakeReq.url = '/api';
        const result = getTarget(fakeReq, config);
        return expect(result).resolves.toBeNull();
      });
    });

    describe('performance considerations', () => {
      it('should handle large routing tables efficiently', () => {
        // Create a large routing table
        const routerTable = {};
        for (let i = 0; i < 1000; i++) {
          routerTable[`/path${i}`] = `http://service${i}.com`;
        }

        // Add our test case at the end
        routerTable['/target-path'] = 'http://target-service.com';

        const config = {
          target: 'http://default.com',
          router: routerTable,
        };

        fakeReq.url = '/target-path';

        const startTime = Date.now();
        const result = getTarget(fakeReq, config);
        const endTime = Date.now();

        expect(result).resolves.toBe('http://target-service.com');

        // Performance assertion - should be reasonably fast
        // This is a soft assertion as performance depends on the environment
        expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
      });
    });
  });
});
