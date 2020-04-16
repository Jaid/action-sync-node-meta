import {info} from "@actions/core"
import immer from "immer"
import {isEqual} from "lodash"
import {upperCaseFirst} from "upper-case-first"

/**
 * @typedef {Object} ConstructorContext
 * @prop {Repository} repository
 * @prop {Pkg} pkg
 */

/**
 * @typedef {Object} Repository
 * @prop {string} description
 * @prop {boolean} fork
 * @prop {string} full_name
 * @prop {string} homepage
 * @prop {string} html_url
 * @prop {License} license
 * @prop {string} master_branch
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

export default class Property {

  /**
   * @type {string[]}
   */
  logMessages = []

  /**
   * @param {ConstructorContext} context
   */
  constructor({repository, pkg}) {
    this.repository = repository
    this.pkg = pkg
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
   * @return {*}
   */
  getPkgValue() {
    const key = this.getPkgKey()
    return this.pkg[key]
  }

  /**
   * @return {*}
   */
  getRepositoryValue() {
    const key = this.getRepositoryKey()
    return this.repository[key]
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
      state[pkgKey] = repositoryValue
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
   * @param {Object} repo
   * @param {string} repo.repo
   * @param {string} repo.owner
   * @param {*} pkgValue
   * @return {Pkg}
   */
  async applyGithubUpdate(octokit, repo, pkgValue) {
    this.log(typeof pkgValue)
    this.log(pkgValue)
    const result = await octokit.request("PATCH /repos/:owner/:repo", {
      ...repo,
      [this.getRepositoryKey()]: pkgValue,
    })
    this.log(`${result.headers.status} ${result.headers.link}`)
  }

}