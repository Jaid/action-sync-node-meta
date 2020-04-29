import getActionBooleanInput from "get-boolean-action-input"

import Property from "lib/Property"

export default class DescriptionProperty extends Property {

  getPkgKey() {
    return "description"
  }

  shouldSkip() {
    const syncDescription = getActionBooleanInput("syncDescription")
    if (!syncDescription) {
      return "inputs.syncDescription is false"
    }
    return false
  }

}