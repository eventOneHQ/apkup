#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'

import { promote } from './promote'
import { upload } from './upload'

const readJson = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, 'utf-8'))

const pkg = readJson(path.join(__dirname, '../../package.json'))

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
  .option('packageName', {
    alias: 'p',
    describe: 'Name of the package (e.g. com.example.yourapp)',
    type: 'string',
    demandOption: true
  })
  .config('config', 'Path to a JSON config file', (configPath: string) => {
    const config = readJson(configPath)
    if (config.key) {
      config.auth = readJson(config.key)
    }
    return {
      packageName: config.packageName,
      p: config.packageName,
      apk: config.apk,
      a: config.apk,
      key: config.key,
      k: config.k,
      auth: config.auth
    }
  })
  .config(
    'key',
    'Path to a JSON file that contains the private key and client email (can be specified via APKUP_KEY env variable)',
    (configPath: string) => {
      return { auth: readJson(configPath) }
    }
  )
  .command(promote)
  .command(upload)
  .env('APKUP')
  .help('help').argv
