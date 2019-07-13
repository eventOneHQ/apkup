<h3 align="center">Apkup</h3>

<div align="center">

[![npm](https://img.shields.io/npm/v/apkup.svg)](https://www.npmjs.com/package/apkup)
[![Build Status](https://travis-ci.com/eventOneHQ/apkup.svg?branch=master)](https://travis-ci.com/eventOneHQ/apkup)
[![GitHub Issues](https://img.shields.io/github/issues/eventOneHQ/apkup.svg)](https://github.com/eventOneHQ/apkup/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/eventOneHQ/apkup.svg)](https://github.com/eventOneHQ/apkup/pulls)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

</div>

---

<p align="center"> Publish APKs to Google Play directly from the terminal
    <br> 
</p>

This package offers a streamlined way to publish packages in the Google Play Store.

A fork of [playup](https://github.com/jeduan/playup).

## 📝 Table of Contents

- [Getting Started](#getting_started)
- [Usage](#usage)
- [Authentication](#authentication)
- [Contributing](CONTRIBUTING.md)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🏁 Getting Started <a name = "getting_started"></a>

Getting started with `apkup` is pretty easy and straight forward.

Install the `apkup` package globally or locally:

```bash
npm i -g apkup
apkup -h

# or if you just want to use the CLI locally
npx apkup -h

# or install the library into your project
npm i -D apkup
```

### CLI

Then use the CLI:

```bash
apkup \
  --key api.json \
  --apk /path/to/Package.apk \
  --release-notes "en-US=lorem ipsum dolor" \
  --obbs /path/to/Expansion.obb \  # optional
  --obbs /path/to/Expansion2.obb   # optional
```

You can also specify each parameter via environment variables prefixed with `APKUP_` (e.g. `APKUP_KEY` or `APKUP_APK`).

### Library

Or use the JavaScript library!

```javascript
// typescript / modulejs
import { Apkup } = from 'apkup';
// or commonjs
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

## 🔒 Authentication <a name = "authentication"></a>

First you have to create a Google Play API Access. To do that go to the
[Google Play Developer Console](https://play.google.com/apps/publish) and then
with the account owner go to Settings -> API access and create a Google Play
Android Developer project.

After that follow the instructions to create a Service Account.
When you click Create Client ID, choose Service Account. You will get a JSON file
with a public key and the service email.

The created Service Account needs the following role:

- Release manager

## 🎈 Usage <a name="usage"></a>

See the full docs [here](https://oss.eventone.page/apkup/classes/apkup).

## ✍️ Authors <a name = "authors"></a>

- [@nprail](https://github.com/nprail) - Maintainer

See also the list of [contributors](https://github.com/eventOneHQ/apkup/contributors) who participated in this project.

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- The original project, [playup](https://github.com/jeduan/playup)!
- Hat tip to anyone whose code was used
