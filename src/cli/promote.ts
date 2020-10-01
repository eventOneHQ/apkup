// tslint:disable: no-console
import ora from 'ora'

import { IPromoteParams } from '../actions/Promote'
import { IEditParams } from '../Edit'
import { Apkup } from '../index'

export const promote = {
  builder: (yargs) => {
    return yargs
      .option('track', {
        alias: 't',
        demandOption: true,
        describe: `Can be 'internal', 'alpha', 'beta', 'production', 'rollout' or any custom track names.`,
        type: 'string'
      })
      .option('version-code', {
        alias: 'v',
        demandOption: true,
        describe: 'Version code of the package to promote.',
        type: 'number'
      })
  },
  command: 'promote [options]',
  desc: 'Promote an APK',
  handler: (argv) => {
    const promoteParams: IPromoteParams = {
      track: argv.track,
      versionCode: argv.versionCode
    }
    const editParams: IEditParams = {
      packageName: argv.packageName
    }

    const apkup = new Apkup(argv.auth)

    const spinner = ora('Promoting APK...').start()

    apkup
      .promote(promoteParams, editParams)
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
