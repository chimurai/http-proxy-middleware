var expect = require('chai').expect;
var configFactory = require('./_libs').configFactory;

describe('configFactory', function() {
    var result;
    var createConfig = configFactory.createConfig;

    describe('createConfig()', function() {

        describe('classic config', function() {
            var context = '/api';
            var options = {target: 'http://www.example.org'};

            beforeEach(function() {
                result = createConfig(context, options);
            });

            it('should return config object', function() {
                expect(result).to.have.all.keys('context', 'options');
            });

            it('should return config object with context', function() {
                expect(result.context).to.equal(context);
            });

            it('should return config object with options', function() {
                expect(result.options).to.deep.equal(options);
            });
        });

        describe('shorthand String', function() {
            describe('shorthand String config', function() {
                beforeEach(function() {
                    result = createConfig('http://www.example.org:8000/api');
                });

                it('should return config object', function() {
                    expect(result).to.have.all.keys('context', 'options');
                });

                it('should return config object with context', function() {
                    expect(result.context).to.equal('/api');
                });

                it('should return config object with options', function() {
                    expect(result.options).to.deep.equal({target: 'http://www.example.org:8000'});
                });
            });

            describe('shorthand String config for whole domain', function() {
                beforeEach(function() {
                    result = createConfig('http://www.example.org:8000');
                });

                it('should return config object with context', function() {
                    expect(result.context).to.equal('/');
                });
            });

            describe('shorthand String config for websocket url', function() {
                beforeEach(function() {
                    result = createConfig('ws://www.example.org:8000');
                });

                it('should return config object with context', function() {
                    expect(result.context).to.equal('/');
                });

                it('should return options with ws = true', function() {
                    expect(result.options.ws).to.equal(true);
                });
            });

            describe('shorthand String config for secure websocket url', function() {
                beforeEach(function() {
                    result = createConfig('wss://www.example.org:8000');
                });

                it('should return config object with context', function() {
                    expect(result.context).to.equal('/');
                });

                it('should return options with ws = true', function() {
                    expect(result.options.ws).to.equal(true);
                });
            });

            describe('shorthand String config with globbing', function() {
                beforeEach(function() {
                    result = createConfig('http://www.example.org:8000/api/*.json');
                });

                it('should return config object with context', function() {
                    expect(result.context).to.equal('/api/*.json');
                });
            });

            describe('shorthand String config with options', function() {
                beforeEach(function() {
                    result = createConfig('http://www.example.org:8000/api', {changeOrigin: true});
                });

                it('should return config object with additional options', function() {
                    expect(result.options).to.deep.equal({target: 'http://www.example.org:8000', changeOrigin: true});
                });
            });
        });

        describe('shorthand Object config', function() {
            beforeEach(function() {
                result = createConfig({target: 'http://www.example.org:8000'});
            });

            it('should set the proxy path to everything', function() {
                expect(result.context).to.equal('/');
            });

            it('should return config object', function() {
                expect(result.options).to.deep.equal({target: 'http://www.example.org:8000'});
            });
        });

        describe('missing option.target', function() {
            var fn;
            beforeEach(function() {
                fn = function() {
                    createConfig('/api');
                };
            });

            it('should throw an error when target option is missing', function() {
                expect(fn).to.throw(Error);
            });
        });

        describe('faulty config. mixing classic with shorthand', function() {
            var fn;
            beforeEach(function() {
                result = createConfig('http://localhost:3000/api', {target: 'http://localhost:8000'});
            });

            it('should use the target in the configuration as target', function() {
                expect(result.options.target).to.equal('http://localhost:8000');
            });

            it('should not use the host from the shorthand as target', function() {
                expect(result.options.target).not.to.equal('http://localhost:3000');
            });
        });

    });

});

