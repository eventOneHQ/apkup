// tslint:disable: no-console

import assert from 'assert'
import ora from 'ora'
import { CommandModule } from 'yargs'

import { Apkup } from '../index'
import { IUploadParams } from './../actions/Upload'

export const upload: CommandModule = {
  aliases: ['$0'],
  builder: (cmd) => {
    return cmd
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
      .option('deobfuscation', {
        alias: 'd',
        describe: 'Path to optional deobfuscation file',
        type: 'string'
      })
      .option('obbs', {
        alias: 'o',
        describe: 'Path to optional expansion files (max 2)',
        type: 'array'
      })
      .demandOption(['apk'])
  },
  command: 'upload [options]',
  describe: 'Upload an APK',
  handler: (argv: any) => {
    const options: IUploadParams = {
      deobfuscation: argv.deobfuscation,
      obbs: argv.obbs,
      releaseNotes: [],
      track: argv.track,
      changesNotSentForReview: argv.changesNotSentForReview
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

    const apkup = new Apkup(argv.auth)

    const spinner = ora('Uploading APK...').start()

    apkup
      .upload(argv.apk, options)
      .then((resp) => {
        spinner.stop()

        console.log('Upload successful!')
      })
      .catch((err) => {
        spinner.stop()

        console.error('ERROR:', err.message)
        process.exit(1)
      })
  }
}
