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
  t.deepEquals(up.apk, [defaultApk], 'Sets apk correctly')
  t.equals(up.track, 'alpha', 'Sets track correctly')
  t.equals(up.obbs.length, 0, 'Sets obbs correctly')
  t.equals(Object.keys(up.recentChanges).length, 0, 'Sets recent changes correctly')
  t.end()
})

test('Upload should assign package name from apk parser', function (t) {
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

test('Should authenticate', function (t) {
  var spy = sinon.spy()
  var Upload = require('../lib/upload')
  var client = {authorize: spy}
  var up = new Upload(client, defaultApk)
  up.authenticate().then(onAuthenticate)

  t.equal(spy.callCount, 1, 'Authenticate is called')
  t.equal(typeof spy.firstCall.args[0], 'function')
  spy.firstCall.args[0]()

  function onAuthenticate () {
    t.end()
  }
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

test('Upload should send the apk', function (t) {
  var spy = sinon.spy()
  var readStream = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      apks: {
        upload: spy
      }
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher},
    'fs': {createReadStream: readStream}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.packageName = defaultPackage
  up.editId = 123
  up.uploadAPK().then(onUpload)

  var callParams = spy.firstCall.args[0]
  t.equal(typeof callParams, 'object')
  t.equal(callParams.packageName, defaultPackage, 'Sets default package')
  t.equal(callParams.editId, 123, 'Sets editId')
  t.equal(callParams.auth, defaultClient)
  t.equal(callParams.media.mimeType, 'application/vnd.android.package-archive', 'Sets MIME type')
  t.equal(readStream.firstCall.args[0], defaultApk, 'Sends the APK')
  t.equal(typeof spy.firstCall.args[1], 'function')
  spy.firstCall.args[1](null, {version: 1, binary: {sha1: ''}})

  function onUpload () {
    t.end()
  }
})

test('Should resolve a promise when there are no OBBs', function (t) {
  var Upload = require('../lib/upload')
  var up = new Upload(defaultClient, defaultApk)
  up.uploadOBBs().then(function () {
    t.end()
  })
})

test('Should upload every OBB', function (t) {
  var spy = sinon.spy()
  var readStream = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      expansionfiles: {
        upload: spy
      }
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher},
    'fs': {createReadStream: readStream}
  })
  var obbs = ['obb1', 'obb2', 'obb3']
  var up = new Upload(defaultClient, defaultApk)
  up.packageName = defaultPackage
  up.editId = 123
  up.versionCode = 1
  up.obbs = obbs

  up.uploadOBBs().then(function () {
    t.end()
  })

  t.equal(typeof spy.firstCall.args[0], 'object')
  t.equal(readStream.firstCall.args[0], obbs[0], 'First OBB uploaded')
  t.equal(typeof spy.firstCall.args[1], 'function')
  spy.firstCall.args[1]()

  t.equal(readStream.secondCall.args[0], obbs[1], 'Second OBB uploaded')
  t.equal(typeof spy.secondCall.args[1], 'function')
  spy.secondCall.args[1]()

  t.equal(readStream.thirdCall.args[0], obbs[2], 'Third OBB uploaded')
  t.equal(typeof spy.thirdCall.args[1], 'function')
  spy.thirdCall.args[1]()
})

test('Should default to alpha track', function (t) {
  var spy = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      tracks: {
        update: spy
      }
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.assignTrack().then(function () {
    t.end()
  })

  var args = spy.firstCall.args
  t.equals(args[0].track, 'alpha')
  t.equals(typeof args[1], 'function')
  args[1](null, {track: 'alpha'})
})

test('Should upload recent changes', function (t) {
  var spy = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      apklistings: {
        update: spy
      }
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher}
  })
  var changes = {
    'en-US': 'lorem',
    'es-MX': 'ipsum',
    'jp': 'dolor'
  }
  var up = new Upload(defaultClient, defaultApk)
  up.packageName = defaultPackage
  up.editId = 123
  up.versionCode = 1
  up.recentChanges = changes

  up.sendRecentChanges().then(function () {
    t.end()
  })

  t.equal(typeof spy.firstCall.args[0], 'object')
  t.equal(spy.firstCall.args[0].language, 'en-US', 'Sets language')
  t.equal(spy.firstCall.args[0].resource.recentChanges, 'lorem', 'Sets language')
  t.equal(typeof spy.firstCall.args[1], 'function')
  spy.firstCall.args[1]()

  t.equal(typeof spy.secondCall.args[1], 'function')
  t.equal(spy.secondCall.args[0].language, 'es-MX', 'Sets language')
  t.equal(spy.secondCall.args[0].resource.recentChanges, 'ipsum', 'Sets language')
  spy.secondCall.args[1]()

  t.equal(typeof spy.thirdCall.args[1], 'function')
  t.equal(spy.thirdCall.args[0].language, 'jp', 'Sets language')
  t.equal(spy.thirdCall.args[0].resource.recentChanges, 'dolor', 'Sets language')
  spy.thirdCall.args[1]()
})

test('Should commit changes', function (t) {
  var spy = sinon.spy()
  var androidpublisher = sinon.stub().returns({
    edits: {
      commit: spy
    }
  })
  var Upload = proxyquire('../lib/upload', {
    'googleapis': {androidpublisher: androidpublisher}
  })
  var up = new Upload(defaultClient, defaultApk)
  up.packageName = defaultPackage
  up.editId = 123
  up.commitChanges().then(function () {
    t.end()
  })
  t.equal(spy.callCount, 1, 'Called one time')
  t.equal(spy.firstCall.args[0].editId, 123, 'Sets the edit id')
  t.equal(spy.firstCall.args[0].packageName, defaultPackage, 'Sets the package name')
  t.equal(spy.firstCall.args[0].auth, defaultClient, 'Sets the package name')
  t.assert(typeof spy.firstCall.args[1] === 'function', 'Receives a callback')
  spy.firstCall.args[1]()
})
