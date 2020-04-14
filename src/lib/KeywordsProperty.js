import Property from "lib/Property"

export default class KeywordsProperty extends Property {

  getPkgKey() {
    return "homepage"
  }

  getRepositoryKey() {
    return "topics"
  }

}