import getActionBooleanInput from "get-boolean-action-input"

import Property from "lib/Property"

export default class DescriptionProperty extends Property {

  getPkgKey() {
    return "description"
  }

  getPkgValue() {
    const key = this.getPkgKey()
    return this.pkg[key] || ''
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
