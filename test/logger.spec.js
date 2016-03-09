var expect = require('chai').expect;
var Logger = require('../lib/logger');
var getArrow = require('../lib/logger').getArrow;

describe('Logger', function() {
    var logger;
    var logMessage, debugMessage, infoMessage, warnMessage, errorMessage;

    beforeEach(function() {
        logMessage   = undefined;
        debugMessage = undefined;
        infoMessage  = undefined;
        warnMessage  = undefined;
        errorMessage = undefined;
    });

    beforeEach(function() {
        logger = Logger.getInstance();
    });

    beforeEach(function() {
        logger.setProvider(function(provider) {
            provider.log   = function(message) {logMessage   = message;};
            provider.debug = function(message) {debugMessage = message;};
            provider.info  = function(message) {infoMessage  = message;};
            provider.warn  = function(message) {warnMessage  = message;};
            provider.error = function(message) {errorMessage = message;};

            return provider;
        });
    });

    describe('logging with different levels', function() {
        beforeEach(function() {
            logger.log('log');
            logger.debug('debug');
            logger.info('info');
            logger.warn('warn');
            logger.error('error');
        });

        describe('level: debug', function() {
            beforeEach(function() {
                logger.setLevel('debug');
            });

            it('should log .log() messages', function() {
                expect(logMessage).to.equal('log');
            });
            it('should log .debug() messages', function() {
                expect(debugMessage).to.equal('debug');
            });
            it('should log .info() messages', function() {
                expect(infoMessage).to.equal('info');
            });
            it('should log .warn() messages', function() {
                expect(warnMessage).to.equal('warn');
            });
            it('should log .error() messages', function() {
                expect(errorMessage).to.equal('error');
            });
        });

        describe('level: info', function() {
            beforeEach(function() {
                logger.setLevel('info');
            });

            it('should log .log() messages', function() {
                expect(logMessage).to.equal('log');
            });
            it('should not log .debug() messages', function() {
                expect(debugMessage).to.equal(undefined);
            });
            it('should log .info() messages', function() {
                expect(infoMessage).to.equal('info');
            });
            it('should log .warn() messages', function() {
                expect(warnMessage).to.equal('warn');
            });
            it('should log .error() messages', function() {
                expect(errorMessage).to.equal('error');
            });
        });

        describe('level: warn', function() {
            beforeEach(function() {
                logger.setLevel('warn');
            });

            it('should log .log() messages', function() {
                expect(logMessage).to.equal('log');
            });
            it('should not log .debug() messages', function() {
                expect(debugMessage).to.equal(undefined);
            });
            it('should not log .info() messages', function() {
                expect(infoMessage).to.equal(undefined);
            });
            it('should log .warn() messages', function() {
                expect(warnMessage).to.equal('warn');
            });
            it('should log .error() messages', function() {
                expect(errorMessage).to.equal('error');
            });
        });

        describe('level: error', function() {
            beforeEach(function() {
                logger.setLevel('error');
            });

            it('should log .log() messages', function() {
                expect(logMessage).to.equal('log');
            });
            it('should not log .debug() messages', function() {
                expect(debugMessage).to.equal(undefined);
            });
            it('should not log .info() messages', function() {
                expect(infoMessage).to.equal(undefined);
            });
            it('should log .warn() messages', function() {
                expect(warnMessage).to.equal(undefined);
            });
            it('should log .error() messages', function() {
                expect(errorMessage).to.equal('error');
            });
        });

        describe('level: silent', function() {
            beforeEach(function() {
                logger.setLevel('silent');
            });

            it('should log .log() messages', function() {
                expect(logMessage).to.equal('log');
            });
            it('should not log .debug() messages', function() {
                expect(debugMessage).to.equal(undefined);
            });
            it('should not log .info() messages', function() {
                expect(infoMessage).to.equal(undefined);
            });
            it('should not log .warn() messages', function() {
                expect(warnMessage).to.equal(undefined);
            });
            it('should not log .error() messages', function() {
                expect(errorMessage).to.equal(undefined);
            });
        });

        describe('Interpolation', function() {
            // make sure all messages are logged
            beforeEach(function() {
                logger.setLevel('debug');
            });

            beforeEach(function() {
                logger.log('log %s %s', 123, 456);
                logger.debug('debug %s %s', 123, 456);
                logger.info('info %s %s', 123, 456);
                logger.warn('warn %s %s', 123, 456);
                logger.error('error %s %s', 123, 456);
            });

            it('should interpolate .log() messages', function() {
                expect(logMessage).to.equal('log 123 456');
            });
            it('should interpolate .debug() messages', function() {
                expect(debugMessage).to.equal('debug 123 456');
            });
            it('should interpolate .info() messages', function() {
                expect(infoMessage).to.equal('info 123 456');
            });
            it('should interpolate .warn() messages', function() {
                expect(warnMessage).to.equal('warn 123 456');
            });
            it('should interpolate .error() messages', function() {
                expect(errorMessage).to.equal('error 123 456');
            });
        });
    });

    describe('Erroneous usage.', function() {
        var fn;

        describe('Log provider is not a function', function() {
            beforeEach(function() {
                fn = function() {
                    logger.setProvider({});
                };
            });

            it('should throw an error', function() {
                expect(fn).to.throw(Error);
            });
        });

        describe('Invalid logLevel', function() {
            beforeEach(function() {
                fn = function() {
                    logger.setLevel('foo');
                };
            });

            it('should throw an error', function() {
                expect(fn).to.throw(Error);
            });
        });

    });

});

describe('getArrow', function() {
    var arrow;
    // scenario = [originalPath, newPath, originalTarget, newTarget]

    describe('default arrow', function() {
        beforeEach(function() {
            arrow = getArrow('/api', '/api', 'localhost:1337', 'localhost:1337');
        });

        it('should return arrow:  "->"', function() {
            expect(arrow).to.equal('->');
        });
    });

    describe('"pathRewrite" arrow', function() {
        beforeEach(function() {
            arrow = getArrow('/api', '/rest', 'localhost:1337', 'localhost:1337');
        });

        it('should return arrow:  "~>"', function() {
            expect(arrow).to.equal('~>');
        });
    });

    describe('"proxyTable" arrow', function() {
        beforeEach(function() {
            arrow = getArrow('/api', '/api', 'localhost:1337', 'localhost:8888');
        });

        it('should return arrow:  "=>"', function() {
            expect(arrow).to.equal('=>');
        });
    });

    describe('"pathRewrite" + "proxyTable" arrow', function() {
        beforeEach(function() {
            arrow = getArrow('/api', '/rest', 'localhost:1337', 'localhost:8888');
        });

        it('should return arrow:  "≈>"', function() {
            expect(arrow).to.equal('≈>');
        });
    });

});
