import { getArrow, getInstance } from '../../src/logger';

describe('Logger', () => {
  let logger;
  let logMessage;
  let debugMessage;
  let infoMessage;
  let warnMessage;
  let errorMessage;

  beforeEach(() => {
    logMessage = undefined;
    debugMessage = undefined;
    infoMessage = undefined;
    warnMessage = undefined;
    errorMessage = undefined;
  });

  beforeEach(() => {
    logger = getInstance();
  });

  beforeEach(() => {
    logger.setProvider(provider => {
      provider.log = message => {
        logMessage = message;
      };
      provider.debug = message => {
        debugMessage = message;
      };
      provider.info = message => {
        infoMessage = message;
      };
      provider.warn = message => {
        warnMessage = message;
      };
      provider.error = message => {
        errorMessage = message;
      };

      return provider;
    });
  });

  describe('logging with different levels', () => {
    beforeEach(() => {
      logger.log('log');
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
    });

    describe('level: debug', () => {
      beforeEach(() => {
        logger.setLevel('debug');
      });

      it('should log .log() messages', () => {
        expect(logMessage).toBe('log');
      });
      it('should log .debug() messages', () => {
        expect(debugMessage).toBe('debug');
      });
      it('should log .info() messages', () => {
        expect(infoMessage).toBe('info');
      });
      it('should log .warn() messages', () => {
        expect(warnMessage).toBe('warn');
      });
      it('should log .error() messages', () => {
        expect(errorMessage).toBe('error');
      });
    });

    describe('level: info', () => {
      beforeEach(() => {
        logger.setLevel('info');
      });

      it('should log .log() messages', () => {
        expect(logMessage).toBe('log');
      });
      it('should not log .debug() messages', () => {
        expect(debugMessage).toBeUndefined();
      });
      it('should log .info() messages', () => {
        expect(infoMessage).toBe('info');
      });
      it('should log .warn() messages', () => {
        expect(warnMessage).toBe('warn');
      });
      it('should log .error() messages', () => {
        expect(errorMessage).toBe('error');
      });
    });

    describe('level: warn', () => {
      beforeEach(() => {
        logger.setLevel('warn');
      });

      it('should log .log() messages', () => {
        expect(logMessage).toBe('log');
      });
      it('should not log .debug() messages', () => {
        expect(debugMessage).toBeUndefined();
      });
      it('should not log .info() messages', () => {
        expect(infoMessage).toBeUndefined();
      });
      it('should log .warn() messages', () => {
        expect(warnMessage).toBe('warn');
      });
      it('should log .error() messages', () => {
        expect(errorMessage).toBe('error');
      });
    });

    describe('level: error', () => {
      beforeEach(() => {
        logger.setLevel('error');
      });

      it('should log .log() messages', () => {
        expect(logMessage).toBe('log');
      });
      it('should not log .debug() messages', () => {
        expect(debugMessage).toBeUndefined();
      });
      it('should not log .info() messages', () => {
        expect(infoMessage).toBeUndefined();
      });
      it('should log .warn() messages', () => {
        expect(warnMessage).toBeUndefined();
      });
      it('should log .error() messages', () => {
        expect(errorMessage).toBe('error');
      });
    });

    describe('level: silent', () => {
      beforeEach(() => {
        logger.setLevel('silent');
      });

      it('should log .log() messages', () => {
        expect(logMessage).toBe('log');
      });
      it('should not log .debug() messages', () => {
        expect(debugMessage).toBeUndefined();
      });
      it('should not log .info() messages', () => {
        expect(infoMessage).toBeUndefined();
      });
      it('should not log .warn() messages', () => {
        expect(warnMessage).toBeUndefined();
      });
      it('should not log .error() messages', () => {
        expect(errorMessage).toBeUndefined();
      });
    });

    describe('Interpolation', () => {
      // make sure all messages are logged
      beforeEach(() => {
        logger.setLevel('debug');
      });

      beforeEach(() => {
        logger.log('log %s %s', 123, 456);
        logger.debug('debug %s %s', 123, 456);
        logger.info('info %s %s', 123, 456);
        logger.warn('warn %s %s', 123, 456);
        logger.error('error %s %s', 123, 456);
      });

      it('should interpolate .log() messages', () => {
        expect(logMessage).toBe('log 123 456');
      });
      it('should interpolate .debug() messages', () => {
        expect(debugMessage).toBe('debug 123 456');
      });
      it('should interpolate .info() messages', () => {
        expect(infoMessage).toBe('info 123 456');
      });
      it('should interpolate .warn() messages', () => {
        expect(warnMessage).toBe('warn 123 456');
      });
      it('should interpolate .error() messages', () => {
        expect(errorMessage).toBe('error 123 456');
      });
    });
  });

  describe('Erroneous usage.', () => {
    let fn;

    describe('Log provider is not a function', () => {
      beforeEach(() => {
        fn = () => {
          logger.setProvider({});
        };
      });

      it('should throw an error', () => {
        expect(fn).toThrowError(Error);
      });
    });

    describe('Invalid logLevel', () => {
      beforeEach(() => {
        fn = () => {
          logger.setLevel('foo');
        };
      });

      it('should throw an error', () => {
        expect(fn).toThrowError(Error);
      });
    });
  });
});

describe('getArrow', () => {
  let arrow;
  // scenario = [originalPath, newPath, originalTarget, newTarget]

  describe('default arrow', () => {
    beforeEach(() => {
      arrow = getArrow('/api', '/api', 'localhost:1337', 'localhost:1337');
    });

    it('should return arrow:  "->"', () => {
      expect(arrow).toBe('->');
    });
  });

  describe('"pathRewrite" arrow', () => {
    beforeEach(() => {
      arrow = getArrow('/api', '/rest', 'localhost:1337', 'localhost:1337');
    });

    it('should return arrow:  "~>"', () => {
      expect(arrow).toBe('~>');
    });
  });

  describe('"router" arrow', () => {
    beforeEach(() => {
      arrow = getArrow('/api', '/api', 'localhost:1337', 'localhost:8888');
    });

    it('should return arrow:  "=>"', () => {
      expect(arrow).toBe('=>');
    });
  });

  describe('"pathRewrite" + "router" arrow', () => {
    beforeEach(() => {
      arrow = getArrow('/api', '/rest', 'localhost:1337', 'localhost:8888');
    });

    it('should return arrow:  "≈>"', () => {
      expect(arrow).toBe('≈>');
    });
  });
});
