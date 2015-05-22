# google-play-publisher

[![npm][npm-image]][npm-url]
[![js-standard-style][standard-image]](https://github.com/feross/standard)

[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/google-play-publisher.svg?style=flat
[npm-url]: https://npmjs.org/package/google-play-publisher

Upload APKs to Google Play

This package offers a streamlined way to publish packages in the Google Play Store

Installation
---

`npm install -g google-play-publisher`

### Play Store setup

First you have to create a Google Play API Access. To do that go to the
[Google Play Developer Console](https://play.google.com/apps/publish) and then
with the account owner go to Settings -> API access and create a Google Play
Android Developer project.

After that follow the instructions to create a Service Account.
When you click Create Client ID, choose Service Account. You will get a JSON file
with a public key and the service email.

Usage
---

    google-play-publisher \
      --auth api.json \
      --recent-changes "en-US=`cat changes.txt`" \
      /path/to/Package.apk \
      /path/to/Expansion.obb \  # optional
      /path/to/Expansion2.obb   # optional

### Other options

 - `--track` Specify track for this release. Can be alpha, beta, production or rollout. Default: alpha

Using the API
---

```javascript
var publisher = require('google-play-publisher')({
  client_email: '',
  private_key: '',
})

var changes = fs.readFileSync('changes.txt')
// track can be alpha, beta, production or rollout
publisher.upload('/path/to/apk', {
  track: 'beta', // default alpha
  obbs: [  // optional expansion files (max 2)
    '/path/to/somefile.obb'
  ],
  recentChanges: {
    'en-US': changes
  },
}, function (err) {
})
```
