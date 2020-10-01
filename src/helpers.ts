import ApkReader from 'adbkit-apkreader'
import Debug from 'debug'
import { readManifest as readAabManifest } from 'node-aab-parser'
import { extname, resolve } from 'path'

/**
 * @ignore
 */
const debug = Debug('apkup:helpers')

export interface IPackageManifest {
  /** ID of the package */
  packageName: string
  /** Version code of the package */
  versionCode: number
}

/**
 * Parse the manifest of an APK file
 * @param apk Path to the APK file
 */
export const parseManifest = async (
  apk: string | string[]
): Promise<IPackageManifest> => {
  debug('> Parsing manifest')
  const apkFile = resolve(typeof apk !== 'string' ? apk[0] : apk)

  let manifest: IPackageManifest

  debug(`> File path ${apkFile}`)
  const ext = extname(apkFile)
  if (ext === '.apk') {
    const reader = await ApkReader.open(apkFile)
    const manifestResponse = await reader.readManifest()

    manifest = {
      packageName: manifestResponse.package,
      versionCode: manifestResponse.versionCode
    }
  } else if (ext === '.aab') {
    const manifestResponse = await readAabManifest(apkFile)

    manifest = {
      packageName: manifestResponse.packageName,
      versionCode: manifestResponse.versionCode
    }
  } else {
    throw new Error('The file must be an APK or AAB.')
  }

  debug(`> Detected package name ${manifest.packageName}`)
  debug(`> Detected version code ${manifest.versionCode}`)

  return manifest
}
