import getActionBooleanInput from "get-boolean-action-input"

import Property from "lib/Property"

export default class HomepageProperty extends Property {

  getPkgKey() {
    return "homepage"
  }

  shouldSkip() {
    const syncHomepage = getActionBooleanInput("syncHomepage")
    if (!syncHomepage) {
      return "inputs.syncHomepage is false"
    }
    return false
  }

}