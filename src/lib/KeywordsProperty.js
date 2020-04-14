import Property from "lib/Property"

export default class KeywordsProperty extends Property {

  getPkgKey() {
    return "keywords"
  }

  getRepositoryKey() {
    return "topics"
  }

}