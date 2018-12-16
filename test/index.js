const test = require('tape')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

test('asks for options', function (t) {
  const { Apkup } = require('../lib')
  t.throws(function () {
    Apkup()
  })
  t.throws(function () {
    Apkup({ client_email: 'foo' })
  })
  t.throws(function () {
    Apkup({ private_key: 'foo' })
  })
  t.doesNotThrow(function () {
    Apkup({ client_email: 'foo', private_key: 'bar' })
  })
  t.end()
})

test('Calls Upload with the right params', function (t) {
  const auth = require('googleapis').auth
  const upload = sinon.stub().returns({
    publish: function () {
      return Promise.resolve()
    }
  })
  const { Apkup } = proxyquire('../lib', {
    './upload': upload
  })

  const client = { client_email: 'foo', private_key: 'bar' }
  const params = {}
  const p = Apkup(client)

  p.upload('my.apk', params, onUpload)

  const args = upload.firstCall.args
  t.assert(args[0] instanceof auth.JWT, 'Client is set up')
  t.equals(args[1], 'my.apk', 'APK name is set up')
  t.equals(args[2], params, 'Params is set up')

  function onUpload () {
    t.end()
  }
})
