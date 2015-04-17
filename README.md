# google-play-publisher

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

    google-play-publisher --track beta --auth api.json --changelog-en-us "some changes" /path/to/Package.apk

Using the API
---

```javascript
var publisher = require('google-play-publisher')({
  client_email: '',
  private_key: '', // either private key or pem
})

// track can be alpha, beta, production or rollout
publisher.upload('alpha', {
  apk: 'path/to/apk',
  recentChanges: {
    'en-US': 'changelog'
  },
  packageName: 'com.your.package.Name',
  versionCode: 1
}, function (err) {
})
```
