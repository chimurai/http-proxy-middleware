var expect = require('chai').expect;
var utils =  require('../lib/utils');

describe('utils', function () {

    it('should have function: hasContext', function () {
        expect(utils.hasContext).to.be.a('function');
    });

    it('should have function: proxyReqHost', function () {
        expect(utils.proxyReqHost).to.be.a('function');
    });

});
