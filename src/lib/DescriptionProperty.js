import getActionBooleanInput from "get-boolean-action-input"

import Property from "lib/Property"

export default class DescriptionProperty extends Property {

  getPkgKey() {
    return "description"
  }

  getRepositoryValue() {
    const key = this.getRepositoryKey()
    return this.repository[key] || undefined
  }

  shouldSkip() {
    const syncDescription = getActionBooleanInput("syncDescription")
    if (!syncDescription) {
      return "input.syncDescription is false"
    }
    if (!this.overwriteFile && typeof this.pkg.description !== "string") {
      return "package.json[description] is not a string"
    }
    return false
  }

}
