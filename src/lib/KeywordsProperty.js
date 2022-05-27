import {isEqual} from "lodash"

import getActionBooleanInput from "./esm/get-boolean-action-input.js"
import normalizeArray from "./normalizeArray.js"
import Property from "./Property.js"

export default class KeywordsProperty extends Property {

  getPkgKey() {
    return "keywords"
  }

  getRepositoryKey() {
    return "topics"
  }

  getRepositoryValue() {
    const key = this.getRepositoryKey()
    return this.repository[key].length > 0 ? this.repository[key] : undefined
  }

  /**
   * @param {*} pkgValue
   * @param {*} repositoryValue
   */
  compare(pkgValue, repositoryValue) {
    const pkgValueNormalized = normalizeArray(pkgValue)
    const repositoryValueNormalized = normalizeArray(repositoryValue)
    return isEqual(pkgValueNormalized, repositoryValueNormalized)
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
    const endpoint = "PUT /repos/:owner/:repo/topics"
    const options = {
      ...repo,
      names: normalizeArray(pkgValue),
    }
    await this.requestGithubApi(octokit, endpoint, options)
  }

  shouldSkip() {
    const syncKeywords = getActionBooleanInput("syncKeywords")
    if (!syncKeywords) {
      return "input.syncKeywords is false"
    }
    if (!this.overwriteFile && !Array.isArray(this.pkg.keywords)) {
      return "package.json[keywords] is not an array"
    }
    return false
  }

}