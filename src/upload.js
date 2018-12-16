import '@babel/polyfill'
import { createReadStream } from 'fs'
import Debug from 'debug'
import ApkReader from 'adbkit-apkreader'
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

  async publish () {
    await this.parseManifest()
    await this.authenticate()
    await this.createEdit()
    await this.uploadAPK()
    await this.uploadOBBs()
    await this.getRecentChanges()
    await this.assignTrack()
    await this.commitChanges()

    return {
      packageName: this.packageName,
      versionCode: this.versionCode
    }
  }

  async parseManifest () {
    debug('> Parsing manifest')
    const reader = await ApkReader.open(this.apk[0])
    const manifest = await reader.readManifest()

    this.packageName = manifest.package
    this.versionCode = manifest.versionCode
    debug(`> Detected package name ${this.packageName}`)
    debug(`> Detected version code ${this.versionCode}`)
  }

  async authenticate () {
    debug('> Authenticating')
    await this.client.authorize()
    debug('> Authenticated successfully')
  }

  async createEdit () {
    debug('> Creating edit')
    const edit = await publisher.edits.insert({
      packageName: this.packageName,
      auth: this.client
    })

    if (!edit) {
      throw new Error('Unable to create edit')
    }
    debug(`> Created edit with id ${edit.data.id}`)
    this.editId = edit.data.id
  }

  async uploadAPK () {
    debug('> Uploading release')
    const that = this
    const uploads = this.apk.map(async apk => {
      const upload = await publisher.edits.apks.upload({
        packageName: that.packageName,
        editId: that.editId,
        auth: that.client,
        media: {
          mimeType: 'application/vnd.android.package-archive',
          body: createReadStream(apk)
        }
      })

      debug(
        `> Uploaded ${apk} with version code ${
          upload.data.versionCode
        } and SHA1 ${upload.data.binary.sha1}`
      )
      versionCodes.push(upload.data.versionCode)
    })
    return Promise.all(uploads)
  }

  async uploadOBBs () {
    if (!this.obbs || !Array.isArray(this.obbs) || !this.obbs.length) {
      return
    }

    debug(`> Uploading ${this.obbs.length} expansion file(s)`)

    await Promise.all(
      this.obbs.map(async obb => {
        await this.uploadOBB(obb)
      })
    )
  }

  async uploadOBB (obb) {
    debug(`> Uploading expansion file ${obb}`)
    await publisher.edits.expansionfiles.upload({
      packageName: this.packageName,
      editId: this.editId,
      apkVersionCode: this.versionCode,
      expansionFileType: 'main',
      auth: this.client,
      media: {
        mimeType: 'application/octet-stream',
        body: createReadStream(obb)
      }
    })
  }

  async getRecentChanges () {
    if (!this.recentChanges || !Object.keys(this.recentChanges).length) {
      return
    }
    debug('> Adding what changed')

    await Promise.all(
      Object.keys(this.recentChanges).map(async lang => {
        await this.sendRecentChange(lang)
      })
    )
  }

  async sendRecentChange (lang) {
    const changes = this.recentChanges[lang]
    releaseNotes.push({
      language: lang,
      text: changes
    })
    debug(`> Added recent changes for ${lang}`)
  }

  async assignTrack () {
    debug(`> Assigning APK to ${this.track} track`)
    await publisher.edits.tracks.update({
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
    })

    debug(`> Assigned APK to ${this.track} track`)
  }

  async commitChanges () {
    debug('> Commiting changes')
    await publisher.edits.commit({
      editId: this.editId,
      packageName: this.packageName,
      auth: this.client
    })

    debug('> Commited changes')
  }
}

Upload.tracks = ['alpha', 'beta', 'production', 'rollout']
