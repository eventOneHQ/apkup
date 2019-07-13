import assert from 'assert'
import Debug from 'debug'
import { createReadStream } from 'fs'
import { JWT } from 'google-auth-library'
import { Edit, IEditParams } from '../Edit'
import { checkTrack } from '../helpers'

const debug = Debug('apkup:Upload')

export interface IUploadParams {
  // tslint:disable-next-line: max-line-length
  /** Specify track for this release. Can be one of the [[tracks]]. Default: `internal` */
  track?: string
  /** An array of objects that specifies changes in this version. Each object has a `language` and `text`. */
  releaseNotes?: IReleaseNotes[]
  /** An array that specifies the paths to the expansion files (OBBs) for this release. */
  obbs?: string[]
}

export interface IReleaseNotes {
  /** Language of the release notes. Example: `en-US` */
  language: string
  /** Text of the release notes */
  text: any
}

/**
 * Create an Upload to Google Play!
 */
export class Upload extends Edit {
  private uploadParams: IUploadParams
  private apk: string[]

  private versionCodes: any[] = []

  constructor (
    client: JWT,
    apk: string | string[],
    uploadParams: IUploadParams = {},
    editParams: IEditParams
  ) {
    super(client, editParams)

    assert(apk, 'I require an APK file')
    if (uploadParams.track) {
      uploadParams.track = uploadParams.track.toLowerCase()

      assert(checkTrack(uploadParams.track), 'Unknown track')
    }

    this.apk = typeof apk === 'string' ? [apk] : apk

    this.uploadParams = uploadParams
    this.uploadParams.track = uploadParams.track || 'internal'
    this.uploadParams.obbs = uploadParams.obbs || []
    this.uploadParams.releaseNotes = uploadParams.releaseNotes || []
  }

  public async makeEdits () {
    await this.uploadAPK()
    await this.uploadOBBs()
    await this.assignTrack()
  }

  private async uploadAPK () {
    debug('> Uploading release')
    const uploads = this.apk.map(async (apk) => {
      const uploadJob = await this.publisher.edits.apks.upload({
        editId: this.editId,
        media: {
          body: createReadStream(apk),
          mimeType: 'application/vnd.android.package-archive'
        },
        packageName: this.editParams.packageName
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
    if (
      !this.uploadParams.obbs ||
      !Array.isArray(this.uploadParams.obbs) ||
      !this.uploadParams.obbs.length
    ) {
      return
    }

    debug(`> Uploading ${this.uploadParams.obbs.length} expansion file(s)`)

    return Promise.all(
      this.uploadParams.obbs.map(async (obb) => this.uploadOBB(obb))
    )
  }

  private async uploadOBB (obb: string) {
    debug(`> Uploading expansion file ${obb}`)

    return this.publisher.edits.expansionfiles.upload(
      {
        apkVersionCode: this.editParams.versionCode,
        editId: this.editId,
        expansionFileType: 'main',
        media: {
          body: createReadStream(obb),
          mimeType: 'application/octet-stream'
        },
        packageName: this.editParams.packageName
      },
      {}
    )
  }

  private async assignTrack () {
    debug(`> Assigning APK to ${this.uploadParams.track} track`)
    const trackUpdate = await this.publisher.edits.tracks.update(
      {
        editId: this.editId,
        packageName: this.editParams.packageName,
        requestBody: {
          releases: [
            {
              releaseNotes: this.uploadParams.releaseNotes,
              status: 'completed',
              versionCodes: this.versionCodes
            }
          ],
          track: this.uploadParams.track
        },
        track: this.uploadParams.track
      },
      {}
    )

    debug(`> Assigned APK to ${this.uploadParams.track} track`)

    return trackUpdate
  }
}
