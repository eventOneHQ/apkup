import { createReadStream } from 'fs'
import Debug from 'debug'
import apkParser from 'node-apk-parser'
import { google } from 'googleapis'
import assert from 'assert'

const debug = Debug('apkup')
const publisher = google.androidpublisher({
  version: 'v3'
})
const versionCodes = []
const releaseNotes = []

export default class Upload {
  constructor (
    client,
    apk,
    params = { track: 'alpha', obbs: [], recentChanges: {} }
  ) {
    assert(client, 'I require a client')
    assert(apk, 'I require an APK route')
    assert(Upload.tracks.indexOf(params.track) !== -1, 'Unknown track')

    this.client = client

    this.apk = typeof apk === 'string' ? [apk] : apk
    this.track = params.track
    this.obbs = params.obbs
    this.recentChanges = params.recentChanges
  }

  publish () {
    return this.parseManifest()
      .then(() => this.authenticate())
      .then(() => this.createEdit())
      .then(() => this.uploadAPK())
      .then(() => this.uploadOBBs())
      .then(() => this.getRecentChanges())
      .then(() => this.assignTrack())
      .then(() => this.commitChanges())
      .then(() => {
        return {
          packageName: this.packageName,
          versionCode: this.versionCode
        }
      })
  }

  parseManifest () {
    debug('> Parsing manifest')
    // Wrapping in promise because apkParser throws in case of error
    return Promise.resolve().then(() => {
      const reader = apkParser.readFile(this.apk[0])
      const manifest = reader.readManifestSync()
      this.packageName = manifest.package
      this.versionCode = manifest.versionCode
      debug('> Detected package name %s', this.packageName)
      debug('> Detected version code %d', this.versionCode)
    })
  }

  authenticate () {
    debug('> Authenticating')
    return new Promise((resolve, reject) => {
      this.client.authorize(err => {
        if (err) return reject(err)
        debug('> Authenticated succesfully')
        resolve()
      })
    })
  }

  createEdit () {
    debug('> Creating edit')
    return new Promise((resolve, reject) => {
      publisher.edits.insert(
        {
          packageName: this.packageName,
          auth: this.client
        },
        (err, edit) => {
          if (err) return reject(err)
          if (!edit) return reject(new Error('Unable to create edit'))
          debug('> Created edit with id %d', edit.data.id)
          this.editId = edit.data.id
          resolve()
        }
      )
    })
  }

  uploadAPK () {
    debug('> Uploading release')
    const that = this
    const uploads = this.apk.map(apk => {
      return new Promise((resolve, reject) => {
        publisher.edits.apks.upload(
          {
            packageName: that.packageName,
            editId: that.editId,
            auth: that.client,
            media: {
              mimeType: 'application/vnd.android.package-archive',
              body: createReadStream(apk)
            }
          },
          (err, upload) => {
            if (err) return reject(err)
            debug(
              '> Uploaded %s with version code %d and SHA1 %s',
              apk,
              upload.data.versionCode,
              upload.data.binary.sha1
            )
            versionCodes.push(upload.data.versionCode)
            resolve()
          }
        )
      })
    })
    return Promise.all(uploads)
  }

  uploadOBBs () {
    if (!this.obbs || !Array.isArray(this.obbs) || !this.obbs.length) {
      return Promise.resolve()
    }

    debug('> Uploading %d expansion file(s)', this.obbs.length)
    let current = Promise.resolve()

    return Promise.all(
      this.obbs.map(obb => {
        current = current.then(this.uploadOBB(obb))
        return current
      })
    )
  }

  uploadOBB (obb) {
    debug('Uploading expansion file %s', obb)
    return new Promise((resolve, reject) => {
      publisher.edits.expansionfiles.upload(
        {
          packageName: this.packageName,
          editId: this.editId,
          apkVersionCode: this.versionCode,
          expansionFileType: 'main',
          auth: this.client,
          media: {
            mimeType: 'application/octet-stream',
            body: createReadStream(obb)
          }
        },
        err => {
          if (err) return reject(err)
          resolve()
        }
      )
    })
  }

  assignTrack () {
    return new Promise((resolve, reject) => {
      debug('> Assigning APK to %s track', this.track)
      publisher.edits.tracks.update(
        {
          packageName: this.packageName,
          editId: this.editId,
          track: this.track,
          resource: {
            track: this.track,
            releases: [
              {
                versionCodes,
                releaseNotes,
                status: 'completed'
              }
            ]
          },
          auth: this.client
        },
        (err, track) => {
          if (err) return reject(err)
          debug('> Assigned APK to %s track', this.track)
          resolve()
        }
      )
    })
  }

  getRecentChanges () {
    if (!this.recentChanges || !Object.keys(this.recentChanges).length) {
      return Promise.resolve()
    }
    debug('> Adding what changed')

    let current = Promise.resolve()
    return Promise.all(
      Object.keys(this.recentChanges).map(lang => {
        current = current.then(this.sendRecentChange(lang))
        return current
      })
    )
  }

  sendRecentChange (lang) {
    return new Promise((resolve, reject) => {
      const changes = this.recentChanges[lang]
      releaseNotes.push({ language: lang, text: changes })
      debug('> Added recent changes for %s', lang)
      resolve()
    })
  }

  commitChanges () {
    debug('> Commiting changes')
    return new Promise((resolve, reject) => {
      publisher.edits.commit(
        {
          editId: this.editId,
          packageName: this.packageName,
          auth: this.client
        },
        (err, commit) => {
          if (err) return reject(err)
          debug('> Commited changes')
          resolve()
        }
      )
    })
  }
}

Upload.tracks = ['alpha', 'beta', 'production', 'rollout']
