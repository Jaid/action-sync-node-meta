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

}