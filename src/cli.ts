#!/usr/bin/env node
import assert from 'assert'
import fs from 'fs'
import ora from 'ora'
import yargs from 'yargs'

import { Apkup } from './index'
import { IUploadParams } from './Upload'

const argv = yargs
  .usage('Usage: $0 [options]')
  .option('key', {
    alias: 'k',
    demandOption: true,
    describe:
      'Path to a JSON file that contains private key and client email (can be specified via APKUP_KEY env variable)'
  })
  .option('apk', {
    alias: 'a',
    demandOption: true,
    describe: 'Path to the APK file'
  })
  .option('track', {
    alias: 't',
    default: 'internal',
    describe: `Can be 'internal', 'alpha', 'beta', 'production' or 'rollout'. Default: 'internal'`,
    type: 'string'
  })
  .option('release-notes', {
    alias: 'r',
    describe: `A string with the format 'lang=changes'`,
    type: 'array'
  })
  .option('obbs', {
    alias: 'o',
    describe: 'Path to optional expansion files (max 2)',
    type: 'array'
  })
  .env('APKUP')
  .help('help').argv

const json = fs.readFileSync(argv.key).toString('utf8')
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

const spinner = ora('Uploading APK...').start()

apkup
  .upload(argv.apk, options)
  .then((resp) => {
    spinner.stop()

    // tslint:disable-next-line: no-console
    console.log('Upload successful!')
  })
  .catch((err) => {
    spinner.stop()

    // tslint:disable-next-line: no-console
    console.error(err.stack)
    process.exit(1)
  })
