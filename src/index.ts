import assert from 'assert'
import { JWT } from 'google-auth-library'
import { google } from 'googleapis'
import { Upload, UploadParams, UploadResponse } from './upload'

/* Object with Authentication information. */
export interface AuthParams {
  /** Google Client Email */
  client_email: string
  /** Google Private Key */
  private_key: string
}

/**
 * Apkup constructor
 *
 * ```typescript
 * import Apkup from 'apkup'
 *
 * const auth = require('./auth.json')
 * const apkup = new Apkup(auth)
 * ```
 */
export default class Apkup {
  private client: JWT

  /**
   * @param {object} auth Object with Authentication information.
   * @param {object} auth.client_email Google Client Email
   * @param {object} auth.private_key Google Private Key
   */
  constructor (auth: AuthParams) {
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
   * @param {object} params The params object will add additional information to this release.
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
    apk: string,
    params?: UploadParams
  ): Promise<UploadResponse> {
    const up = new Upload(this.client, apk, params)
    return up.publish()
  }
}
