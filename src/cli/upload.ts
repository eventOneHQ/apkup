// tslint:disable: no-console

import assert from 'assert'
import ora from 'ora'

import { Apkup } from '../index'
import { IUploadFile, IUploadParams } from './../actions/Upload'

export const upload = {
  aliases: ['$0'],
  builder: (cmd) => {
    cmd
      .option('track', {
        alias: 't',
        default: 'internal',
        describe: `Can be 'internal', 'alpha', 'beta', 'production', 'rollout' or any custom track names. Default: 'internal'`,
        type: 'string'
      })
      .option('release-notes', {
        alias: 'r',
        describe: `A string with the format 'lang=changes'`,
        type: 'array'
      })
      .demandOption(['file'])
  },
  command: 'upload [options]',
  desc: 'Upload a release',
  handler: (argv) => {
    const options: IUploadParams = {
      files: [],
      releaseNotes: [],
      track: argv.track
    }

    options.files = argv.file.map(
      (fileListString: string): IUploadFile => {
        const files = fileListString.split(',')

        // the actual file should always be first and should always be an AAB or APK
        const file = files[0]
        assert.strictEqual(
          file.endsWith('.apk') || file.endsWith('.aab'),
          true,
          'The first file must be either an APK or an AAB.'
        )

        // obb files should always end with .obb
        const obbs = files.filter((filename) => filename.endsWith('.obb'))

        // and mapping files should not end with .apk, .aab, or .obb
        const mappings = files.find(
          (filename) =>
            !filename.endsWith('.apk') &&
            !filename.endsWith('.aab') &&
            !filename.endsWith('.obb')
        )

        return {
          file,
          mappings,
          obbs
        }
      }
    )

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
      .upload(options)
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
