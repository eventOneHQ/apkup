#!/usr/bin/env node

var argv = require('yargs')
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

var fs = require('fs')
var assert = require('assert')

var authJSON = JSON.parse(fs.readFileSync(argv.auth)) // assume a JSON
var options = {
  track: argv.track,
  obbs: argv.obbs
}

if (argv.recentChanges) {
  options.recentChanges = {}
  argv.recentChanges.forEach(function (change) {
    assert.notStrictEqual(
      change.indexOf('='),
      -1,
      'Unable to parse recent changes'
    )

    var parts = change.split('=')
    assert.strictEqual(parts.length, 2, 'Unable to parse recent changes')

    options.recentChanges[parts[0]] = parts[1]
  })
}

var publisher = require('./lib')(authJSON)
publisher.upload(argv._[0], options).catch(function (err) {
  console.error(err.stack)
  process.exit(1)
})
