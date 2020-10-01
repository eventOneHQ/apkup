import assert from 'assert'
import Debug from 'debug'
import { createReadStream } from 'fs'
import { JWT } from 'google-auth-library'
import { extname } from 'path'
import { Edit, IEditParams } from '../Edit'

/**
 * @ignore
 */
const debug = Debug('apkup:Upload')

export interface IUploadFile {
  /** The APK or AAB file to upload. */
  file: string
  /** A path to the deobfuscation mappings file for this APK/AAB. */
  mappings?: string
  /** An array that specifies the paths to the expansion files (OBBs) for this APK/AAB. */
  obbs?: string[]
}

export interface IUploadParams {
  /** An array of objects that specify the files to upload for this release. */
  files: IUploadFile[]
  /** Specify track for this release. Default: `internal` */
  track?: string
  /** An array of objects that specifies changes in this version. Each object has a `language` and `text`. */
  releaseNotes?: IReleaseNotes[]
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

  private versionCodes: any[] = []

  constructor (
    client: JWT,
    uploadParams: IUploadParams,
    editParams: IEditParams
  ) {
    super(client, editParams)

    assert(uploadParams?.files[0]?.file, 'At least one file is required')

    this.uploadParams = uploadParams
    this.uploadParams.track = uploadParams?.track?.toLowerCase() || 'internal'
    this.uploadParams.releaseNotes = uploadParams.releaseNotes || []
  }

  public async makeEdits () {
    await this.uploadFiles()
    await this.assignTrack()
  }

  private async uploadFiles () {
    debug('> Uploading release')
    const uploads = this.uploadParams.files.map(async (fileObject) => {
      let uploadJob: any

      const ext = extname(fileObject.file)
      if (ext === '.apk') {
        uploadJob = await this.publisher.edits.apks.upload({
          editId: this.editId,
          media: {
            body: createReadStream(fileObject.file),
            mimeType: 'application/octet-stream'
          },
          packageName: this.editParams.packageName
        })

        debug(
          `> Uploaded ${fileObject.file} with version code ${
            uploadJob.data.versionCode
          } and SHA1 ${uploadJob.data.binary && uploadJob.data.binary.sha1}`
        )
      } else if (ext === '.aab') {
        uploadJob = await this.publisher.edits.bundles.upload({
          editId: this.editId,
          media: {
            body: createReadStream(fileObject.file),
            mimeType: 'application/octet-stream'
          },
          packageName: this.editParams.packageName
        })

        debug(
          `> Uploaded ${fileObject.file} with version code ${uploadJob.data.versionCode} and SHA1 ${uploadJob.data.sha1}`
        )
      }

      const versionCode: number = uploadJob.data.versionCode
      this.versionCodes.push(versionCode)

      if (fileObject.obbs) {
        await this.uploadOBBs(fileObject.obbs, versionCode)
      }

      if (fileObject.mappings) {
        await this.uploadMappings(fileObject.mappings, versionCode)
      }

      return uploadJob
    })
    return Promise.all(uploads)
  }

  private async uploadMappings (mappings: string, versionCode: number) {
    debug(`> Uploading mappings ${mappings} for ${versionCode}`)
    return this.publisher.edits.deobfuscationfiles.upload(
      {
        apkVersionCode: versionCode,
        deobfuscationFileType: 'proguard',
        editId: this.editId,
        media: {
          body: createReadStream(mappings),
          mimeType: 'application/octet-stream'
        },
        packageName: this.editParams.packageName
      },
      {}
    )
  }

  private async uploadOBBs (obbs: string[], versionCode: number) {
    if (!obbs || !Array.isArray(obbs) || !obbs.length) {
      return
    }

    debug(`> Uploading ${obbs.length} expansion file(s) for ${versionCode}`)

    return Promise.all(
      obbs.map(async (obb) => this.uploadOBB(obb, versionCode))
    )
  }

  private async uploadOBB (obb: string, versionCode: number) {
    debug(`> Uploading expansion file ${obb} for ${versionCode}`)

    return this.publisher.edits.expansionfiles.upload(
      {
        apkVersionCode: versionCode,
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
