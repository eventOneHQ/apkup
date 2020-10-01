import assert from 'assert'
import { JWT } from 'google-auth-library'
import { google } from 'googleapis'
import { IPromoteParams, Promote } from './actions/Promote'
import { IUploadParams, Upload } from './actions/Upload'
import { IEditParams, IEditResponse } from './Edit'
import { parseManifest } from './helpers'

/* Object with Authentication information. */
export interface IAuthParams {
  /** Google Client Email */
  client_email: string
  /** Google Private Key */
  private_key: string
}

/**
 * Apkup constructor
 *
 * ```typescript
 * import { Apkup } from 'apkup'
 *
 * const auth = require('./auth.json')
 * const apkup = new Apkup(auth)
 * ```
 */
export class Apkup {
  private client: JWT

  /**
   * @param {object} auth Object with Authentication information.
   * @param {object} auth.client_email Google Client Email
   * @param {object} auth.private_key Google Private Key
   */
  constructor (auth: IAuthParams) {
    assert(auth.client_email, 'Missing required parameter client_email')
    assert(auth.private_key, 'Missing required parameter private_key')

    this.client = new google.auth.JWT(
      auth.client_email,
      undefined,
      auth.private_key,
      ['https://www.googleapis.com/auth/androidpublisher']
    )
  }

  /**
   * Upload a release to the Google Play Developer Console.
   * @param {object} params The params object includes the information for this release.
   *
   * @returns An object with the response data.
   *
   * ```typescript
   * const upload = await apkup.upload({
   *   files: [
   *     {
   *       file: './android-debug.apk'
   *     }
   *   ],
   *   track: 'beta',
   *   releaseNotes: [
   *     {
   *       language: 'en-US',
   *       text: 'Minor bug fixes...'
   *     }
   *   ]
   * })
   * ```
   */
  public async upload (params: IUploadParams): Promise<IEditResponse> {
    const file = params.files[0]?.file

    assert(file, 'At least one file is required')

    const manifest = await parseManifest(file)

    const editParams: IEditParams = {
      packageName: manifest.packageName
    }

    const upload = new Upload(this.client, params, editParams)
    return upload.run()
  }

  /**
   * Promote an APK from one track to another.
   *
   * @param {object} promoteParams Information related to the promotion.
   * @param {string} apk The path to the APK.
   * @param {object} editParams The package name and version code of the app.
   *
   * ```typescript
   * // promote based on an APK
   * await apkup.promote(
   *   {
   *     track: 'alpha'
   *   },
   *   './android-debug.apk'
   * )
   *
   * // promote based on package name and version code
   * await apkup.promote(
   *   {
   *     track: 'alpha',
   *     versionCode: 137
   *   },
   *   {
   *     packageName: 'io.event1.shared'
   *  }
   * )
   * ```
   */
  public async promote (
    promoteParams: IPromoteParams,
    apk?: string | string[],
    editParams?: IEditParams
  ) {
    let edit: IEditParams

    if (apk) {
      const apkPackage = await parseManifest(apk)

      edit = {
        packageName: apkPackage.packageName
      }
    } else if (editParams) {
      edit = editParams
    } else {
      throw new Error(
        'Either apk or package-name and version-code are required'
      )
    }

    const promote = new Promote(this.client, edit, promoteParams)
    return promote.run()
  }
}
