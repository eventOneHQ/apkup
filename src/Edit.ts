import assert from 'assert'
import Debug from 'debug'
import { JWT } from 'google-auth-library'
import { androidpublisher_v3, google } from 'googleapis'

const debug = Debug('apkup:Edit')

export interface IEditParams {
  /** ID of the package to be edited. */
  packageName: string
  /** Version code of the package to be edited. */
  versionCode: number
}

export interface IEditResponse {
  /** ID of the package that was edited. */
  packageName?: string
  /** Version code of the package that was edited. */
  versionCode?: number
}

/**
 * Creates an Edit.
 *
 * This class should be extended by another class and `makeEdits` should be overridden.
 *
 * ```typescript
 * class Promote extends Edit {
 *  constructor(client: JWT, editParams: IEditParams) {
 *    super(client, editParams)
 *  }
 *
 *  public async makeEdits {
 *    // make edits here!
 *  }
 * }
 * ```
 */
export class Edit {
  public editParams: IEditParams

  /** ID of the edit. */
  public editId?: string
  /** AndroidPublisher instance */
  public publisher: androidpublisher_v3.Androidpublisher

  /** JWT auth client for AndroidPublisher */
  private client: JWT

  constructor (client: JWT, editParams: IEditParams) {
    assert(client, 'I require a client')
    assert(editParams.packageName, 'I require a package name')
    assert(editParams.versionCode, 'I require a version code')

    this.client = client
    this.publisher = google.androidpublisher({
      auth: client,
      version: 'v3'
    })
    this.editParams = editParams
  }

  /**
   * This method should be overridden to make your own changes.
   */
  public async makeEdits () {
    throw new Error('makeEdits not implemented!')
  }

  /**
   * Run the edit
   */
  public async run (): Promise<IEditResponse> {
    // authenticate the client
    await this.authenticate()

    // create the edit
    await this.createEdit()

    // run the edits (this should be overridden via a sub-class)
    await this.makeEdits()

    // commit the changes
    await this.commitChanges()

    return {
      packageName: this.editParams.packageName,
      versionCode: this.editParams.versionCode
    }
  }

  private async authenticate () {
    debug('> Authenticating')
    await this.client.authorize()
    debug('> Authenticated successfully')
  }

  private async createEdit () {
    debug('> Creating edit')
    const edit = await this.publisher.edits.insert({
      packageName: this.editParams.packageName
    })

    if (!edit) {
      throw new Error('Unable to create edit')
    }
    debug(`> Created edit with id ${edit.data.id}`)
    this.editId = edit.data.id
  }

  private async commitChanges () {
    debug('> Commiting changes')
    const editCommit = await this.publisher.edits.commit({
      editId: this.editId,
      packageName: this.editParams.packageName
    })

    debug('> Commited changes')

    return editCommit
  }
}
