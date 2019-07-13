import assert from 'assert'
import Debug from 'debug'
import { JWT } from 'google-auth-library'
import { androidpublisher_v3 } from 'googleapis'
import { checkTrack } from './../helpers'

import { Edit, IEditParams, IEditResponse } from './../Edit'

const debug = Debug('apkup:Promote')

export interface IPromoteParams {
  /** Specify track for this release. Can be one of the [[tracks]]. */
  track: string
}

export class Promote extends Edit {
  public promoteParams: IPromoteParams

  private previousTrack?: androidpublisher_v3.Schema$Track
  private previousRelease?: androidpublisher_v3.Schema$TrackRelease

  constructor (
    client: JWT,
    editParams: IEditParams,
    promoteParams: IPromoteParams
  ) {
    super(client, editParams)

    if (promoteParams.track) {
      promoteParams.track = promoteParams.track.toLowerCase()

      assert(checkTrack(promoteParams.track), 'Unknown track')
    }

    this.promoteParams = promoteParams
  }

  public async makeEdits () {
    await this.findPreviousTrack()
    await this.findPreviousRelease()
    await this.assignTrack()
    await this.removePreviousTrack()
  }

  private findRelease (track: any) {
    if (!track || !track.releases) {
      return null
    }

    return track.releases.find((r) => {
      return (
        r.versionCodes &&
        r.versionCodes.includes(this.editParams.versionCode.toString()) &&
        r.status &&
        r.status === 'completed'
      )
    })
  }

  private async findPreviousTrack () {
    debug(`> Finding the previous track`)
    const list = await this.publisher.edits.tracks.list({
      editId: this.editId,
      packageName: this.editParams.packageName
    })

    if (list.data.tracks) {
      const previousTrack = list.data.tracks.find((t) => {
        const track = this.findRelease(t)

        return !!track
      })

      this.previousTrack = previousTrack
    }
  }

  private async findPreviousRelease () {
    debug(`> Finding the previous release`)

    if (!this.previousTrack) {
      throw new Error(
        'Previous track not found! Has this version been uploaded? '
      )
    } else if (this.previousTrack.track === this.promoteParams.track) {
      throw new Error(
        `The previous track (${
          this.previousTrack.track
        }) is the same as the one that you are trying to promote to (${
          this.promoteParams.track
        }).`
      )
    }
    this.previousRelease = this.findRelease(this.previousTrack)
  }

  private async assignTrack () {
    const newTrack = this.promoteParams.track
    debug(`> Assigning APK to ${newTrack} track`)

    const trackUpdate = await this.publisher.edits.tracks.update(
      {
        editId: this.editId,
        packageName: this.editParams.packageName,
        requestBody: {
          releases: [
            {
              releaseNotes:
                this.previousRelease && this.previousRelease.releaseNotes,
              status: 'completed',
              versionCodes: [this.editParams.versionCode.toString()]
            }
          ],
          track: newTrack
        },
        track: newTrack
      },
      {}
    )

    debug(`> Assigned APK to ${this.promoteParams.track} track`)

    return trackUpdate
  }

  private async removePreviousTrack () {
    const oldTrack = this.previousTrack && this.previousTrack.track

    debug(`> Removing APK from ${oldTrack} track`)

    const trackUpdate = await this.publisher.edits.tracks.update(
      {
        editId: this.editId,
        packageName: this.editParams.packageName,
        requestBody: {
          releases: [],
          track: oldTrack
        },
        track: oldTrack
      },
      {}
    )

    debug(`> Removed APK from ${oldTrack} track`)

    return trackUpdate
  }
}
