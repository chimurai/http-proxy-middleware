var expect = require('chai').expect;
var configFactory = require('../lib/config-factory');

describe('configFactory', function () {
    var result;

    describe('createConfig()', function () {

        describe('classic api', function () {
            var context = '/api';
            var options = {target: 'http://www.example.org'};

            beforeEach(function () {
                result = configFactory.createConfig(context, options);
            });

            it('should return on config object', function () {
                expect(result).to.have.all.keys('context', 'options');
            });

            it('should return on config object with context', function () {
                expect(result.context).to.equal(context);
            });

            it('should return on config object with options', function () {
                expect(result.options).to.deep.equal(options);
            });
        });

        describe('shorthand api', function () {
            beforeEach(function () {
                result = configFactory.createConfig('http://www.example.org:8000/api');
            });

            it('should return on config object', function () {
                expect(result).to.have.all.keys('context', 'options');
            });

            it('should return on config object with context', function () {
                expect(result.context).to.equal('/api');
            });

            it('should return on config object with options', function () {
                expect(result.options).to.deep.equal({target: 'http://www.example.org:8000'});
            });
        });

        describe('shorthand api for whole domain', function () {
            beforeEach(function () {
                result = configFactory.createConfig('http://www.example.org:8000');
            });

            it('should return on config object with context', function () {
                expect(result.context).to.equal('/');
            });
        });

        describe('shorthand api with globbing', function () {
            beforeEach(function () {
                result = configFactory.createConfig('http://www.example.org:8000/api/*.json');
            });

            it('should return on config object with context', function () {
                expect(result.context).to.equal('/api/*.json');
            });
        });

        describe('shorthand api with options', function () {
            beforeEach(function () {
                result = configFactory.createConfig('http://www.example.org:8000/api', {changeOrigin: true});
            });

            it('should return on config object with additional options', function () {
                expect(result.options).to.deep.equal({target: 'http://www.example.org:8000', changeOrigin: true});
            });
        });

        describe('missing option.target', function () {
            var fn
            beforeEach(function () {
                fn = function () {
                    configFactory.createConfig('/api');
                }
            });

            it('should throw an error when target option is missing', function () {
                expect(fn).to.throw(Error);
            });
        });


    });

});

