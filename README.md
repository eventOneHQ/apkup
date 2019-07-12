<h1 align="center">apkup</h1>

<p align="center">
<a href="https://www.npmjs.com/package/apkup"><img src="https://img.shields.io/npm/v/apkup.svg?style=flat" alt="npm"></a>
<a href="https://travis-ci.com/eventOneHQ/apkup"><img src="https://travis-ci.com/eventOneHQ/apkup.svg?branch=master" alt="Build Status"></a>
<a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>

</p>
<p align="center"><b>🚀 Upload APKs to Google Play</b></p>

This package offers a streamlined way to publish packages in the Google Play Store.

A fork of [playup](https://github.com/jeduan/playup).

## Install

```
npm install -g apkup
```

## Usage

Use the CLI

```bash
apkup \
  --auth api.json \
  --release-notes "en-US='lorem ipsum dolor'" \
  --file /path/to/Package.apk \
  --obbs /path/to/Expansion.obb \  # optional
  --obbs /path/to/Expansion2.obb   # optional
```

or the JavaScript API

```javascript
const { Apkup } = require('apkup');

const apkup = Apkup({
  client_email: '',
  private_key: ''
});

apkup
  .upload('/path/to/apk', {
    obbs: [
      // optional expansion files (max 2)
      '/path/to/somefile.obb'
    ],
    releaseNotes: [
      {
        language: 'en-US',
        text: 'Minor bug fixes...'
      }
    ]
  })
  .then(data => {
    console.log(` > ${data.packageName} version ${data.versionCode} is up!`);
  });
```

## Authentication

First you have to create a Google Play API Access. To do that go to the
[Google Play Developer Console](https://play.google.com/apps/publish) and then
with the account owner go to Settings -> API access and create a Google Play
Android Developer project.

After that follow the instructions to create a Service Account.
When you click Create Client ID, choose Service Account. You will get a JSON file
with a public key and the service email.

The created Service Account needs the following role:

- Release manager

## Gulp Support

The `upload` method returns a `Promise` so this package can be used in conjunction with gulp with no extra plugins needed

```javascript
gulp.task(upload, () => {
  return publisher.upload(apk, params);
});
```

## CLI

### apkup --auth auth.json --release-notes "release notes" --file app.apk --obbs [OBB]

#### auth

_Required_
Type: `File`

a JSON file with the [Authentication information](#authentication)

#### release-notes

_Required_
Type: `string`

A string with the format `lang=changes` where lang is the language code and changes the string that specifies the changes of this

#### track

Type: `string`

Specify track for this release. Can be alpha, beta, production or rollout. Default: alpha

#### APK

The path to the APK

#### OBB

The path to 1 or more expansion files

## API

See the [API docs](https://oss.eventone.page/apkup).
