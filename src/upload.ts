import ApkReader from 'adbkit-apkreader'
import assert from 'assert'
import Debug from 'debug'
import { createReadStream } from 'fs'
import { JWT } from 'google-auth-library'
import { google } from 'googleapis'

const debug = Debug('apkup')
const publisher = google.androidpublisher({
  version: 'v3'
})

export interface UploadParams {
  /** Specify track for this release. Can be `internal`, `alpha`, `beta`, `production` or `rollout`. Defaults to `internal` */
  track?: string
  /**An array of objects that specifies changes in this version. Each object has a `language` and `text`. */
  releaseNotes?: ReleaseNotes[]
  /** An array that specifies the paths to the expansion files (OBBs) for this release. */
  obbs?: string[]
}

export interface UploadResponse {
  /** ID of the package that was uploaded. */
  packageName?: string
  /** Version code of the package that was uploaded. */
  versionCode?: number
}

export interface ReleaseNotes {
  /** Language of the release notes */
  language: string
  /** Text of the release notes */
  text: any
}

/**
 * Create an Upload
 * @ignore
 */
export class Upload {
  /**
   * Available tracks
   */
  public tracks = ['internal', 'alpha', 'beta', 'production', 'rollout']

  public packageName?: string
  public versionCode?: number
  public editId?: string

  private client: JWT
  private apk: any[]
  private track: string
  private obbs: string[]

  private versionCodes: any[] = []
  private releaseNotes: ReleaseNotes[] = []

  constructor (client: JWT, apk: string, params: UploadParams = {}) {
    assert(client, 'I require a client')
    assert(apk, 'I require an APK route')
    if (params.track) {
      assert(this.tracks.includes(params.track), 'Unknown track')
    }

    this.client = client

    this.apk = typeof apk === 'string' ? [apk] : apk
    this.track = params.track || 'internal'
    this.obbs = params.obbs || []
    this.releaseNotes = params.releaseNotes || []
  }

  public async publish (): Promise<UploadResponse> {
    await this.parseManifest()
    await this.authenticate()
    await this.createEdit()
    await this.uploadAPK()
    await this.uploadOBBs()
    await this.assignTrack()
    await this.commitChanges()

    return {
      packageName: this.packageName,
      versionCode: this.versionCode
    }
  }

  private async parseManifest () {
    debug('> Parsing manifest')
    const reader = await ApkReader.open(this.apk[0])
    const manifest = await reader.readManifest()

    this.packageName = manifest.package
    this.versionCode = manifest.versionCode
    debug(`> Detected package name ${this.packageName}`)
    debug(`> Detected version code ${this.versionCode}`)
  }

  private async authenticate () {
    debug('> Authenticating')
    await this.client.authorize()
    debug('> Authenticated successfully')
  }

  private async createEdit () {
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

  private async uploadAPK () {
    debug('> Uploading release')
    const uploads = this.apk.map(async (apk) => {
      const uploadJob = await publisher.edits.apks.upload({
        packageName: this.packageName,
        editId: this.editId,
        auth: this.client,
        media: {
          mediaType: 'application/vnd.android.package-archive',
          body: createReadStream(apk)
        }
      })

      debug(
        `> Uploaded ${apk} with version code ${
          uploadJob.data.versionCode
        } and SHA1 ${uploadJob.data.binary && uploadJob.data.binary.sha1}`
      )
      this.versionCodes.push(uploadJob.data.versionCode)

      return uploadJob
    })
    return Promise.all(uploads)
  }

  private async uploadOBBs () {
    if (!this.obbs || !Array.isArray(this.obbs) || !this.obbs.length) {
      return
    }

    debug(`> Uploading ${this.obbs.length} expansion file(s)`)

    return Promise.all(this.obbs.map(async (obb) => this.uploadOBB(obb)))
  }

  private async uploadOBB (obb: string) {
    debug(`> Uploading expansion file ${obb}`)

    return publisher.edits.expansionfiles.upload(
      {
        packageName: this.packageName,
        editId: this.editId,
        apkVersionCode: this.versionCode,
        expansionFileType: 'main',
        auth: this.client,
        media: {
          mediaType: 'application/octet-stream',
          body: createReadStream(obb)
        }
      },
      {}
    )
  }

  private async assignTrack () {
    debug(`> Assigning APK to ${this.track} track`)
    const trackUpdate = await publisher.edits.tracks.update(
      {
        packageName: this.packageName,
        editId: this.editId,
        track: this.track,
        auth: this.client,
        requestBody: {
          track: this.track,
          releases: [
            {
              versionCodes: this.versionCodes,
              releaseNotes: this.releaseNotes,
              status: 'completed'
            }
          ]
        }
      },
      {}
    )

    debug(`> Assigned APK to ${this.track} track`)

    return trackUpdate
  }

  private async commitChanges () {
    debug('> Commiting changes')
    const editCommit = await publisher.edits.commit({
      editId: this.editId,
      packageName: this.packageName,
      auth: this.client
    })

    debug('> Commited changes')

    return editCommit
  }
}
