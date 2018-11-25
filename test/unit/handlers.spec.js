/* eslint-disable no-unused-expressions */
// https://github.com/feross/standard/issues/690#issuecomment-278533482

var expect = require('chai').expect
var handlers = require('./_libs').handlers

describe('handlers factory', function () {
  var handlersMap

  it('should return default handlers when no handlers are provided', function () {
    handlersMap = handlers.getHandlers()
    expect(handlersMap.error).to.be.a('function')
    expect(handlersMap.close).to.be.a('function')
  })

  describe('custom handlers', function () {
    beforeEach(function () {
      var fnCustom = function () {
        return 42
      }

      var proxyOptions = {
        target: 'http://www.example.org',
        onError: fnCustom,
        onOpen: fnCustom,
        onClose: fnCustom,
        onProxyReq: fnCustom,
        onProxyReqWs: fnCustom,
        onProxyRes: fnCustom,
        onDummy: fnCustom,
        foobar: fnCustom
      }

      handlersMap = handlers.getHandlers(proxyOptions)
    })

    it('should only return http-proxy handlers', function () {
      expect(handlersMap.error).to.be.a('function')
      expect(handlersMap.open).to.be.a('function')
      expect(handlersMap.close).to.be.a('function')
      expect(handlersMap.proxyReq).to.be.a('function')
      expect(handlersMap.proxyReqWs).to.be.a('function')
      expect(handlersMap.proxyRes).to.be.a('function')
      expect(handlersMap.dummy).to.be.undefined
      expect(handlersMap.foobar).to.be.undefined
      expect(handlersMap.target).to.be.undefined
    })

    it('should use the provided custom handlers', function () {
      expect(handlersMap.error()).to.equal(42)
      expect(handlersMap.open()).to.equal(42)
      expect(handlersMap.close()).to.equal(42)
      expect(handlersMap.proxyReq()).to.equal(42)
      expect(handlersMap.proxyReqWs()).to.equal(42)
      expect(handlersMap.proxyRes()).to.equal(42)
    })
  })
})

describe('default proxy error handler', function () {
  var mockError = {
    code: 'ECONNREFUSED'
  }

  var mockReq = {
    headers: {
      host: 'localhost:3000'
    },
    url: '/api'
  }

  var proxyOptions = {
    target: {
      host: 'localhost.dev'
    }
  }

  var httpErrorCode
  var errorMessage

  var mockRes = {
    writeHead: function (v) {
      httpErrorCode = v
      return v
    },
    end: function (v) {
      errorMessage = v
      return v
    },
    headersSent: false
  }

  var proxyError

  beforeEach(function () {
    var handlersMap = handlers.getHandlers()
    proxyError = handlersMap.error
  })

  afterEach(function () {
    httpErrorCode = undefined
    errorMessage = undefined
  })

  var codes = [
    ['HPE_INVALID_FOO', 502],
    ['HPE_INVALID_BAR', 502],
    ['ECONNREFUSED', 504],
    ['ENOTFOUND', 504],
    ['ECONNREFUSED', 504],
    ['any', 500]
  ]
  codes.forEach(function (item) {
    var msg = item[0]
    var code = item[1]
    it('should set the http status code for ' + msg + ' to: ' + code, function () {
      proxyError({ code: msg }, mockReq, mockRes, proxyOptions)
      expect(httpErrorCode).to.equal(code)
    })
  })

  it('should end the response and return error message', function () {
    proxyError(mockError, mockReq, mockRes, proxyOptions)
    expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost:3000/api')
  })

  it('should not set the http status code to: 500 if headers have already been sent', function () {
    mockRes.headersSent = true
    proxyError(mockError, mockReq, mockRes, proxyOptions)
    expect(httpErrorCode).to.equal(undefined)
  })

  it('should end the response and return error message', function () {
    mockRes.headersSent = true
    proxyError(mockError, mockReq, mockRes, proxyOptions)
    expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost:3000/api')
  })
})
