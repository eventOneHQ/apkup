var fs = require('fs')
var async = require('async')
var google = require('googleapis')
var assert = require('assert')
var debug = require('debug')('google-play-publisher')

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

Publisher.prototype.upload = function upload (track, params, callback) {
  assert(Publisher.tracks.indexOf(track) !== -1, 'Unknown track')
  params = params || {}
  assert(params.apk, 'I require an APK route')

  var self = this
  var editId

  async.waterfall([

    function (done) {
      debug('> Authenticating')
      self.client.authorize(function (err) {
        debug('> Authenticated succesfully')
        done(err)
      })
    },

    function (done) {
      debug('> Creating edit')
      publisher.edits.insert({
        packageName: params.packageName,
        auth: self.client
      }, function (err, edit) {
        debug('> Created edit with id %d', edit.id)
        editId = edit.id
        done(err)
      })
    },

    function (done) {
      debug('> Uploading release')
      publisher.edits.apks.upload({
        packageName: params.packageName,
        editId: editId,
        auth: self.client,
        media: {
          mimeType: 'application/vnd.android.package-archive',
          body: fs.createReadStream(params.apk)
        }
      }, function (err, upload) {
        debug('> Uploaded %s with version code %d and SHA1 %s', params.apk, upload.versionCode, upload.binary.sha1)
        done(err)
      })
    },

    function (done) {
      debug('> Assigning APK to %s track', track)
      publisher.edits.tracks.update({
        packageName: params.packageName,
        editId: editId,
        track: track,
        resource: {
          versionCodes: [params.versionCode]
        },
        auth: self.client
      }, function (err, track) {
        debug('> Assigned APK to %s track', track.track)
        done(err)
      })
    },

    function (done) {
      if (!params.recentChanges) return done()
      debug('> Adding what changed')
      async.eachSeries(Object.keys(params.recentChanges), function (lang, next) {
        var changes = params.recentChanges[lang]
        publisher.edits.apklistings.update({
          apkVersionCode: params.versionCode,
          editId: editId,
          language: lang,
          packageName: params.packageName,
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

    function (done) {
      debug('> Commiting changes')
      publisher.edits.commit({
        editId: editId,
        packageName: params.packageName,
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
