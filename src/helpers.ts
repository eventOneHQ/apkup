import ApkReader from 'adbkit-apkreader'
import Debug from 'debug'

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
  const apkFile = typeof apk !== 'string' ? apk[0] : apk
  const reader = await ApkReader.open(apkFile)
  const manifest = await reader.readManifest()

  debug(`> Detected package name ${manifest.package}`)
  debug(`> Detected version code ${manifest.versionCode}`)

  return {
    packageName: manifest.package,
    versionCode: manifest.versionCode
  }
}

/**
 * Available tracks
 */
export const tracks: string[] = [
  'internal',
  'alpha',
  'beta',
  'production',
  'rollout'
]

/**
 * Check if a track is valid
 * @param track Name of the track to check
 *
 * @returns Does the track exits?
 */
export const checkTrack = (track: string): boolean => {
  return tracks.includes(track)
}
