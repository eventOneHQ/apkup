import {auth} from 'googleapis'
import assert from 'assert'
import Upload from './upload'
import nodeify from 'nodeify'

function Publisher (options) {
  if (!(this instanceof Publisher)) {
    return new Publisher(options)
  }
  assert(options.client_email, 'Missing required parameter client_email')
  assert(options.private_key, 'Missing required parameter private_key')

  this.client = new auth.JWT(
    options.client_email,
    null,
    options.private_key,
    ['https://www.googleapis.com/auth/androidpublisher']
  )
}

Publisher.prototype.upload = function upload (apk, params, cb) {
  let up = new Upload(this.client, apk, params)
  return nodeify(up.publish(), cb)
}

export default Publisher
