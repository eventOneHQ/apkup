var fs = require('fs')
var async = require('async')
var google = require('googleapis')
var assert = require('assert')
var debug = require('debug')('google-play-publisher')
var apkParser = require('node-apk-parser')

var publisher = google.androidpublisher('v2')

function Publisher (options) {
  if (!(this instanceof Publisher)) {
    return new Publisher(options)
  }
  options = options || {}
  assert(options.client_email, 'I require options.client_email')
  assert(options.private_key, 'I require a private_key')

  this.client = new google.auth.JWT(
    options.client_email,
    null,
    options.private_key,
    ['https://www.googleapis.com/auth/androidpublisher']
  )
}

Publisher.tracks = ['alpha', 'beta', 'production', 'rollout']

Publisher.prototype.upload = function upload (apk, params, callback) {
  assert(apk, 'I require an APK route')
  params = params || {}
  params.track = params.track || 'beta'
  assert(Publisher.tracks.indexOf(params.track) !== -1, 'Unknown track')

  var self = this
  var editId
  var packageName
  var versionCode

  async.waterfall([

    function parseManifest (done) {
      try {
        var reader = apkParser.readFile(apk)
        var manifest = reader.readManifestSync()
        packageName = manifest.package
        versionCode = manifest.versionCode
        debug('Detected package name %s', packageName)
        debug('Detected version code %d', versionCode)
        done()
      } catch (err) {
        done(err)
      }
    },

    function authenticate (done) {
      debug('> Authenticating')
      self.client.authorize(function (err) {
        debug('> Authenticated succesfully')
        done(err)
      })
    },

    function createEdit (done) {
      debug('> Creating edit')
      publisher.edits.insert({
        packageName: packageName,
        auth: self.client
      }, function (err, edit) {
        debug('> Created edit with id %d', edit.id)
        editId = edit.id
        done(err)
      })
    },

    function uploadAPK (done) {
      debug('> Uploading release')
      publisher.edits.apks.upload({
        packageName: packageName,
        editId: editId,
        auth: self.client,
        media: {
          mimeType: 'application/vnd.android.package-archive',
          body: fs.createReadStream(apk)
        }
      }, function (err, upload) {
        debug('> Uploaded %s with version code %d and SHA1 %s', apk, upload.versionCode, upload.binary.sha1)
        done(err)
      })
    },

    function assignTrack (done) {
      debug('> Assigning APK to %s track', params.track)
      publisher.edits.tracks.update({
        packageName: packageName,
        editId: editId,
        track: params.track,
        resource: {
          versionCodes: [versionCode]
        },
        auth: self.client
      }, function (err, track) {
        debug('> Assigned APK to %s track', track.track)
        done(err)
      })
    },

    function sendRecentChanges (done) {
      if (!params.recentChanges) return done()
      debug('> Adding what changed')
      async.eachSeries(Object.keys(params.recentChanges), function (lang, next) {
        var changes = params.recentChanges[lang]
        publisher.edits.apklistings.update({
          apkVersionCode: versionCode,
          editId: editId,
          language: lang,
          packageName: packageName,
          resource: {
            recentChanges: changes
          },
          auth: self.client
        }, function (err, edit) {
          debug('> Added recent changes for %s', lang)
          next(err)
        })
      }, function (err, result) {
        done(err)
      })
    },

    function commitChanges (done) {
      debug('> Commiting changes')
      publisher.edits.commit({
        editId: editId,
        packageName: packageName,
        auth: self.client
      }, function (err, commit) {
        debug('> Commited changes')
        done(err)
      })
    }

  ], function (err) {
    if (err) return callback(err)
    debug('> Finished uploading APK')
  })
}

module.exports = Publisher
