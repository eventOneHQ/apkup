import { google } from 'googleapis'
import assert from 'assert'
import Upload from './upload'
import nodeify from 'nodeify'

function Apkup (options) {
  if (!(this instanceof Apkup)) {
    return new Apkup(options)
  }
  assert(options.client_email, 'Missing required parameter client_email')
  assert(options.private_key, 'Missing required parameter private_key')

  this.client = new google.auth.JWT(
    options.client_email,
    null,
    options.private_key,
    ['https://www.googleapis.com/auth/androidpublisher']
  )
}

Apkup.prototype.upload = function upload (apk, params, cb) {
  let up = new Upload(this.client, apk, params)
  return nodeify(up.publish(), cb)
}

export { Apkup }
