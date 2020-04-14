/**
 * @typedef {Object} ConstructorContext
 * @prop {Repository} repository
 * @prop {Pkg} pkg
 */

import {upperCaseFirst} from "upper-case-first"

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

}