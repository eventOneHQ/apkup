import { google } from 'googleapis'
import assert from 'assert'
import Upload from './upload'

/**
 * Apkup is a constructor that can be called with or without `new`.
 * @param {object} auth - Object with Authentication information.
 * @param {object} auth.client_email - Google Client Email
 * @param {object} auth.private_key - Google Private Key
 * @constructor
 */
function Apkup (auth) {
  if (!(this instanceof Apkup)) {
    return new Apkup(auth)
  }
  assert(auth.client_email, 'Missing required parameter client_email')
  assert(auth.private_key, 'Missing required parameter private_key')

  this.client = new google.auth.JWT(auth.client_email, null, auth.private_key, [
    'https://www.googleapis.com/auth/androidpublisher'
  ])
}

/**
 * Upload an APK to the Google Play Developer Console.
 * @async
 * @param {string} apk - The path to the APK.
 * @param {object} [params] - The params object will add additional information to this release.
 * @param {string} [params.track=alpha] - Specify track for this release. Can be `alpha`, `beta`, `production` or `rollout`.
 * @param {object} [params.recentChanges] - An `object` that specifies changes in this version. Has the language code as key and the changes as value.
 * @param {array} [params.obbs] - An array that specifies the paths to the expansion files (OBBs) for this release.
 *
 * @returns {Promise<object>} An object with the response data.
 */
Apkup.prototype.upload = async function upload (apk, params) {
  const up = new Upload(this.client, apk, params)
  return up.publish()
}

export { Apkup }
