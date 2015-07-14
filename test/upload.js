var test = require('tape')
var proxyquire = require('proxyquire')
var sinon = require('sinon')
var Upload = require('../lib/upload')

var defaultClient = {}
var defaultApk = '/path/to/apk'
var defaultPackage = 'com.jeduan.test'

test('Upload should create with default options', function (t) {
  var up = new Upload(defaultClient, defaultApk)
  t.equals(up.client, defaultClient, 'Sets client correctly')
  t.equals(up.apk, defaultApk, 'Sets apk correctly')
  t.equals(up.track, 'alpha', 'Sets track correctly')
  t.equals(up.obbs.length, 0, 'Sets obbs correctly')
  t.equals(Object.keys(up.recentChanges).length, 0, 'Sets recent changes correctly')
  t.end()
})

test('Upload should assing package name from apk parser', function (t) {
  var readManifestSync = sinon.stub().returns({
    package: defaultPackage,
    versionCode: 1
  })
  var readFile = sinon.stub().returns({
    readManifestSync: readManifestSync
  })
  var Upload = proxyquire('../lib/upload', {
    'node-apk-parser': {readFile: readFile}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.parseManifest()
    .then(function () {
      t.equals(up.packageName, defaultPackage, 'Sets package name correctly')
      t.equals(up.versionCode, 1, 'Sets version code correctly')
      t.end()
    })
    .catch(function (err) {
      console.error(err)
      t.ok(false, 'This should not happen')
      t.end()
    })
})

test('Upload should catch errors in apk parser', function (t) {
  var readFile = sinon.stub().throws()
  var Upload = proxyquire('../lib/upload', {
    'node-apk-parser': {readFile: readFile}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.parseManifest()
    .catch(function (err) {
      t.ok(err instanceof Error, 'Thrown an error')
      t.end()
    })
})

test('Upload should set editId correctly', function (t) {
  var spy = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      insert: spy
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.packageName = defaultPackage
  up.createEdit().then(onEdit)

  var callParams = spy.firstCall.args[0]
  t.equal(typeof callParams, 'object')
  t.equal(callParams.packageName, defaultPackage)
  t.equal(callParams.auth, defaultClient)
  t.equal(typeof spy.firstCall.args[1], 'function')
  spy.firstCall.args[1](null, {id: 123})

  function onEdit () {
    t.equals(up.editId, 123, 'Sets up editId correctly')
    t.end()
  }
})
