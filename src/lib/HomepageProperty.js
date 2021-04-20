import getActionBooleanInput from "get-boolean-action-input"

import Property from "lib/Property"

export default class HomepageProperty extends Property {

  getPkgKey() {
    return "homepage"
  }

  getRepositoryValue() {
    const key = this.getRepositoryKey()
    return this.repository[key] || undefined
  }

  shouldSkip() {
    const syncHomepage = getActionBooleanInput("syncHomepage")
    if (!syncHomepage) {
      return "input.syncHomepage is false"
    }
    if (!this.overwriteFile && typeof this.pkg.homepage !== "string") {
      return "package.json[homepage] is not a string"
    }
    return false
  }

}
