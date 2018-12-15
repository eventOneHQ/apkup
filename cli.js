#!/usr/bin/env node

const fs = require('fs')
const assert = require('assert')
const yargs = require('yargs')

const { Apkup } = require('./lib')

const argv = yargs
  .usage('Usage: $0 [options]')
  .option('t', {
    alias: 'track',
    type: 'string',
    default: 'alpha'
  })
  .option('a', {
    alias: 'auth',
    describe: 'JSON file that contains private key and client email',
    demandOption: true
  })
  .option('r', {
    alias: 'recent-changes',
    type: 'array'
  })
  .option('f', {
    alias: 'file',
    describe: 'APK files',
    demandOption: true
  })
  .option('o', {
    alias: 'obbs',
    describe: 'Optional expansion files (max 2)',
    type: 'array'
  })
  .help('h').argv

const authJSON = JSON.parse(fs.readFileSync(argv.auth)) // assume a JSON
const options = {
  track: argv.track,
  obbs: argv.obbs
}

if (argv.recentChanges) {
  options.recentChanges = {}
  argv.recentChanges.forEach(change => {
    assert.notStrictEqual(
      change.indexOf('='),
      -1,
      'Unable to parse recent changes'
    )

    const parts = change.split('=')
    assert.strictEqual(parts.length, 2, 'Unable to parse recent changes')

    options.recentChanges[parts[0]] = parts[1]
  })
}

const apkup = Apkup(authJSON)
apkup.upload(argv.file, options).catch(err => {
  console.error(err.stack)
  process.exit(1)
})
