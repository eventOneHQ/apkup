# playup [![npm][npm-image]][npm-url] [![js-standard-style][standard-image]](https://github.com/feross/standard)

[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/playup.svg?style=flat
[npm-url]: https://npmjs.org/package/playup

 > Upload APKs to Google Play

This package offers a streamlined way to publish packages in the Google Play Store

## Install

```
npm install -g playup
```

## Usage

```bash
playup \
  --auth api.json \
  --recent-changes "en-US='lorem ipsum dolor'" \
  /path/to/Package.apk \
  /path/to/Expansion.obb \  # optional
  /path/to/Expansion2.obb   # optional
```

or with the JavaScript API

```javascript
var publisher = require('playup')({
  client_email: '',
  private_key: '',
})

publisher.upload('/path/to/apk', {
  obbs: [  // optional expansion files (max 2)
    '/path/to/somefile.obb'
  ],
  recentChanges: {
    'en-US': 'lorem ipsum dolor'
  },
}).then(function (data) {
  console.log(' > %s version %d is up!', data.packageName, data.versionCode)
})
```

## Authentication

First you have to create a Google Play API Access. To do that go to the
[Google Play Developer Console](https://play.google.com/apps/publish) and then
with the account owner go to Settings -> API access and create a Google Play
Android Developer project.

After that follow the instructions to create a Service Account.
When you click Create Client ID, choose Service Account. You will get a JSON file
with a public key and the service email.

## API

#### CLI

 - `--track` Specify track for this release. Can be alpha, beta, production or rollout. Default: alpha

#### JavaScript
---

 - `track` Specify track for this release. Can be alpha, beta, production or rollout. Default: alpha
 - `recentChanges` An object that has as key every language
