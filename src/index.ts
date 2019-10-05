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
   * Upload an APK to the Google Play Developer Console.
   * @param {string} apk The path to the APK.
   * @param {object} uploadParams The params object will add additional information to this release.
   *
   * @returns An object with the response data.
   *
   * ```typescript
   * const upload = await apkup.upload('./android-debug.apk', {
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
  public async upload (
    apk: string | string[],
    uploadParams?: IUploadParams
  ): Promise<IEditResponse> {
    const apkPackage = await parseManifest(apk)

    const editParams: IEditParams = {
      packageName: apkPackage.packageName,
      versionCode: apkPackage.versionCode
    }

    const upload = new Upload(this.client, apk, uploadParams, editParams)
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
   *     track: 'alpha'
   *   },
   *   {
   *     packageName: 'io.event1.shared',
   *     versionCode: 137
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
        packageName: apkPackage.packageName,
        versionCode: apkPackage.versionCode
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
