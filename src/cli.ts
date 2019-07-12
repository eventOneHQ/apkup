#!/usr/bin/env node
/**
 * @ignore
 */

import assert from 'assert'
import fs from 'fs'
import yargs from 'yargs'

import { Apkup } from './index'
import { IUploadParams } from './upload'

const argv = yargs
  .usage('Usage: $0 [options]')
  .option('k', {
    alias: 'key',
    demandOption: true,
    describe: 'Path to a JSON file that contains private key and client email'
  })
  .option('a', {
    alias: 'apk',
    demandOption: true,
    describe: 'Path to the APK file'
  })
  .option('t', {
    alias: 'track',
    default: 'internal',
    describe:
      'Can be `internal`, `alpha`, `beta`, `production` or `rollout`. Default: `internal`',
    type: 'string'
  })
  .option('r', {
    alias: 'release-notes',
    describe: 'A string with the format `lang=changes`',
    type: 'array'
  })
  .option('o', {
    alias: 'obbs',
    describe: 'Path to optional expansion files (max 2)',
    type: 'array'
  })
  .help('h').argv

const json = fs.readFileSync(argv.auth).toString('utf8')
const authJSON = JSON.parse(json) // assume a JSON file

const options: IUploadParams = {
  obbs: argv.obbs,
  releaseNotes: [],
  track: argv.track
}

if (argv.releaseNotes) {
  options.releaseNotes = []

  for (const change of argv.releaseNotes) {
    assert.strictEqual(
      change.includes('='),
      true,
      'Unable to parse release notes'
    )

    const parts = change.split('=')
    assert.strictEqual(parts.length, 2, 'Unable to parse release notes')

    options.releaseNotes.push({
      language: parts[0],
      text: parts[1]
    })
  }
}

const apkup = new Apkup(authJSON)

apkup
  .upload(argv.file, options)
  .then((resp) => {
    // tslint:disable-next-line: no-console
    console.log('Upload successful!')
  })
  .catch((err) => {
    // tslint:disable-next-line: no-console
    console.error(err.stack)
    process.exit(1)
  })
