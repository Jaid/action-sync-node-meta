import {info} from "@actions/core"
import {isEqual} from "lodash"

import normalizeArray from "lib/normalizeArray"
import Property from "lib/Property"

export default class KeywordsProperty extends Property {

  getPkgKey() {
    return "keywords"
  }

  getRepositoryKey() {
    return "topics"
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
   * @return {Pkg}
   */
  async applyGithubUpdate(octokit, repo, pkgValue) {
    const result = await octokit.request("PUT /repos/:owner/:repo/topics", {
      ...repo,
      names: normalizeArray(pkgValue),
    })
    info(`${result.headers.status} ${result.headers.link}`)
  }

}