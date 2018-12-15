# apkup [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![npm][npm-image]][npm-url] [![js-standard-style][standard-image]][standard-url]

[travis-image]: https://travis-ci.org/Filiosoft/apkup.svg?branch=master
[travis-url]: https://travis-ci.org/Filiosoft/apkup
[coveralls-image]: https://coveralls.io/repos/filiosoft/apkup/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/filiosoft/apkup?branch=master
[npm-image]: https://img.shields.io/npm/v/apkup.svg?style=flat
[npm-url]: https://npmjs.org/package/apkup
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

> Upload APKs to Google Play

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
  --recent-changes "en-US='lorem ipsum dolor'" \
  --file /path/to/Package.apk \
  --obbs /path/to/Expansion.obb \  # optional
  --obbs /path/to/Expansion2.obb   # optional
```

or the JavaScript API

```javascript
const publisher = require('apkup')({
  client_email: '',
  private_key: ''
})

publisher
  .upload('/path/to/apk', {
    obbs: [
      // optional expansion files (max 2)
      '/path/to/somefile.obb'
    ],
    recentChanges: {
      'en-US': 'lorem ipsum dolor'
    }
  })
  .then(data => {
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

## gulp support

The `upload` method returns a `Promise` so this package can be used in conjunction with gulp with no extra plugins needed

```javascript
gulp.task(upload, () => {
  return publisher.upload(apk, params)
})
```

## CLI

### apkup --auth auth.json --recent-changes "recent changes" --file app.apk --obbs [OBB]

#### auth

_Required_
Type: `File`

a JSON file with the [Authentication information](#authentication)

#### recent-changes

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

### Apkup = require('apkup')

Apkup is a constructor that can be called with or without `new`

### publisher = new Apkup(auth)

The instance of Apkup has the `auth` option

#### auth

_Required_
Type: `object`

The object with Authentication information. This object will have the following keys

- `client_email`
- `private_key`

### publisher.upload(apk[, params[, callback]])

Upload specified APK. If no callback is specified, returns a `Promise`

#### apk

_Required_
Type: `string`

The path to the APK to upload

#### params

_Optional_
Type: `object`

The params object will add aditional information to this release. Currently, it can have these keys

##### track

Type: string
Default: `'alpha'`

Specify track for this release. Can be alpha, beta, production or rollout.

##### recentChanges

Type: object
Default: `{}`

An `object` that specifies changes in this version. Has the language code as key and the changes as value.

##### obbs

Type: Array
Default: `[]`

An array that specifies the paths to the expansion files (OBBs) for this release

#### callback

A function to be called when the process finishes. It receives two params:

##### err

The error if the upload was not succesful

##### data

An object with the following properties

- `packageName`
- `versionCode`
