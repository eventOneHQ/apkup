#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'

import { promote } from './promote'
import { upload } from './upload'

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
)

const argv = yargs
  .usage('Usage: $0 [options]')
  .version(pkg.version)
  .option('key', {
    alias: 'k',
    config: true,
    demandOption: true
  })
  .option('apk', {
    alias: 'a',
    describe: 'Path to the APK file',
    type: 'array'
  })
  .option('changesNotSentForReview', {
    alias: 'cnsfr',
    describe: 'Indicates that the changes in publish will not be reviewed until they are explicitly sent for review from the Google Play Console UI. These changes will be added to any other changes that are not yet sent for review',
    type: 'boolean'
  })
  .config(
    'key',
    'Path to a JSON file that contains the private key and client email (can be specified via APKUP_KEY env variable)',
    (configPath) => {
      return { auth: JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
    }
  )
  .command(promote)
  .command(upload)
  .env('APKUP')
  .help('help')
  .alias('help', 'h').argv
