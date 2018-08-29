var express = require('express')
var expect = require('chai').expect
var http = require('http')
var proxy = require('../../index')

describe('Usage in Express', function () {
  var app
  var server

  beforeEach(function () {
    app = express()
  })

  afterEach(function () {
    server && server.close()
  })

  // https://github.com/chimurai/http-proxy-middleware/issues/94
  describe('Express Sub Route', function () {
    beforeEach(function () {
      // sub route config
      var sub = new express.Router()

      function filter (pathname, req) {
        var urlFilter = new RegExp('^/sub/api')
        var match = urlFilter.test(pathname)
        return match
      }

      /**
       * Mount proxy without 'path' in sub route
       */
      var proxyConfig = { target: 'http://jsonplaceholder.typicode.com', changeOrigin: true, logLevel: 'silent' }
      sub.use(proxy(filter, proxyConfig))

      sub.get('/hello', jsonMiddleware({ 'content': 'foobar' }))

      // configure sub route on /sub junction
      app.use('/sub', sub)

      // start server
      server = app.listen(3000)
    })

    it('should still return a response when route does not match proxyConfig', function (done) {
      var responseBody
      http.get('http://localhost:3000/sub/hello', function (res) {
        res.on('data', function (chunk) {
          responseBody = chunk.toString()
          expect(responseBody).to.equal('{"content":"foobar"}')
          done()
        })
      })
    })
  })

  function jsonMiddleware (data) {
    return function (req, res) {
      res.json(data)
    }
  }
})
