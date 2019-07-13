// tslint:disable: no-console
import ora from 'ora'

import { IPromoteParams } from '../actions/Promote'
import { IEditParams } from '../Edit'
import { Apkup } from '../index'

export const promote = {
  builder: (yargs) => {
    yargs
      .option('track', {
        alias: 't',
        demandOption: true,
        describe: `Can be 'internal', 'alpha', 'beta', 'production' or 'rollout'.`,
        type: 'string'
      })
      .option('version-code', {
        alias: 'v',
        describe: 'Version code of the package to promote.',
        type: 'number'
      })
      .option('package-name', {
        alias: 'p',
        describe: 'ID of the package to promote.',
        type: 'string'
      })
      .check((argv) => {
        if (argv.packageName && argv.versionCode) {
          return true
        } else if (argv.apk) {
          return true
        } else {
          throw new Error(
            'You must specify either package-name and version-code or apk'
          )
        }
      })
  },
  command: 'promote [options]',
  desc: 'Promote an APK',
  handler: (argv) => {
    const promoteParams: IPromoteParams = {
      track: argv.track
    }
    const editParams: IEditParams = {
      packageName: argv.packageName,
      versionCode: argv.versionCode
    }

    const apkup = new Apkup(argv.auth)

    const spinner = ora('Promoting APK...').start()

    apkup
      .promote(promoteParams, argv.apk, editParams)
      .then((resp) => {
        spinner.stop()

        console.log('Promotion successful!')
      })
      .catch((err) => {
        spinner.stop()

        console.error('ERROR:', err.message)
        process.exit(1)
      })
  }
}
