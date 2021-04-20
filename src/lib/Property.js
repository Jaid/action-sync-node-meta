import immer from "immer"
import {isEqual} from "lodash"
import readableMs from "readable-ms"
import {upperCaseFirst} from "upper-case-first"

/**
 * @typedef {Object} ConstructorContext
 * @prop {Repository} repository
 * @prop {Pkg} pkg
 * @prop {boolean} overwriteFile
 */

/**
 * @typedef {Object} Repository
 * @prop {string} description
 * @prop {boolean} fork
 * @prop {string} full_name
 * @prop {string} homepage
 * @prop {string} html_url
 * @prop {License} license
 */

/**
 * @typedef {Object} License
 * @prop {string} key
 * @prop {string} name
 * @prop {string} node_id
 * @prop {string} spdx_id
 * @prop {string} url
 */

/**
 * @typedef {Object} Pkg
 * @prop {string} homepage
 * @prop {string} description
 * @prop {string[]} keywords
 */

/**
 * @class Property
 */
export default class Property {

  /**
   * @type {string[]}
   */
  logMessages = []

  /**
   * @type {boolean}
   */
  enabled = true

  /**
   * @param {ConstructorContext} defaultValues
   */
  constructor(defaultValues) {
    this.repository = defaultValues.repository
    this.pkg = defaultValues.pkg
    this.overwriteFile = defaultValues.overwriteFile
    const shouldSkip = this.shouldSkip()
    if (shouldSkip !== false) {
      this.log(`Syncing for this property is not enabled: ${shouldSkip}`)
      this.enabled = false
    }
  }

  /**
   * @return {string}
   */
  getPkgKey() {
    throw new Error("This must be implemented by child class")
  }

  /**
   * @return {string}
   */
  getRepositoryKey() {
    return this.getPkgKey()
  }

  /**
   * @return {string}
   */
   getPkgValue() {
    throw new Error("This must be implemented by child class")
  }

  /**
   * @return {*}
   */
  getRepositoryValue() {
    const key = this.getRepositoryKey()
    return this.repository[key]
  }

  /**
   * @return {false|string}
   */
  shouldSkip() {
    return false
  }

  /**
   * @return {string}
   */
  getTitle() {
    const key = this.getPkgKey()
    return upperCaseFirst(key)
  }

  /**
   * @param {*} pkgValue
   * @param {*} repositoryValue
   */
  compare(pkgValue, repositoryValue) {
    return isEqual(pkgValue, repositoryValue)
  }

  /**
   * @param {Pkg} pkgBefore
   * @param {*} repositoryValue
   * @return {Pkg}
   */
  applyPkgUpdate(pkgBefore, repositoryValue) {
    const pkgKey = this.getPkgKey()
    return immer(pkgBefore, state => {
      if (["", undefined, null].includes(repositoryValue)) {
        delete state[pkgKey]
      } else {
        state[pkgKey] = repositoryValue
      }
    })
  }

  /**
   * @param {string} message
   */
  log(message) {
    this.logMessages.push(message)
  }

  /**
   * @param {import("@octokit/rest").Octokit} octokit
   * @param {string} endpoint
   * @param {Object} [options]
   * @return {Promise<void>}
   */
  async requestGithubApi(octokit, endpoint, options) {
    this.log(`API endpoint: ${endpoint}`)
    this.log(`API options: ${Object.keys(options).join(", ")}`)
    const startTime = Date.now()
    const result = await octokit.request(endpoint, options)
    const ms = Date.now() - startTime
    this.log(`${result.headers.status} in ${readableMs(ms)}`)
  }

  /**
   * @param {import("@octokit/rest").Octokit} octokit
   * @param {Object} repo
   * @param {string} repo.repo
   * @param {string} repo.owner
   * @param {*} pkgValue
   * @return {Promise<void>}
   */
  async applyGithubUpdate(octokit, repo, pkgValue) {
    const endpoint = "PATCH /repos/:owner/:repo"
    const options = {
      ...repo,
      [this.getRepositoryKey()]: pkgValue,
    }
    await this.requestGithubApi(octokit, endpoint, options)
  }

}
