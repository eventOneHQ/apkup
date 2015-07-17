var test = require('tape')
var proxyquire = require('proxyquire')
var sinon = require('sinon')

test('asks for options', function (t) {
  var Publisher = require('../lib')
  t.throws(function () {
    Publisher()
  })
  t.throws(function () {
    Publisher({client_email: 'foo'})
  })
  t.throws(function () {
    Publisher({private_key: 'foo'})
  })
  t.doesNotThrow(function () {
    Publisher({client_email: 'foo', private_key: 'bar'})
  })
  t.end()
})

test('Calls Upload with the right params', function (t) {
  var auth = require('googleapis').auth
  var upload = sinon.stub().returns({
    publish: function () {
      return Promise.resolve()
    }
  })
  var Publisher = proxyquire('../lib', {
    './upload': upload
  })

  var client = {client_email: 'foo', private_key: 'bar'}
  var params = {}
  var p = Publisher(client)

  p.upload('my.apk', params, onUpload)

  var args = upload.firstCall.args
  t.assert(args[0] instanceof auth.JWT, 'Client is set up')
  t.equals(args[1], 'my.apk', 'APK name is set up')
  t.equals(args[2], params, 'Params is set up')

  function onUpload () {
    t.end()
  }
})
