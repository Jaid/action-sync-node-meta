import {debug, info, setFailed} from "@actions/core"
import {context} from "@actions/github"
import readFileJson from "read-file-json"

import DescriptionProperty from "lib/DescriptionProperty"
import HomepageProperty from "lib/HomepageProperty"

async function main() {
  const pkg = await readFileJson("package.json")
  if (!pkg) {
    info("No package.json found, skipping")
    return
  }
  if (!context?.payload?.repository) {
    throw new Error("Could not fetch repository info from context.payload.repository")
  }
  const constructorContext = {
    repository: context.payload.repository,
    pkg,
  }
  /**
   * @type {import("lib/Property").default[]}
   */
  const properties = [
    new DescriptionProperty(constructorContext),
    new HomepageProperty(constructorContext),
  ]
  for (const property of properties) {
    debug(property.getTitle())
    debug(`pkg[${property.getPkgKey()}]: ${JSON.stringify(property.getPkgValue())}`)
    debug(`repository[${property.getRepositoryKey()}]: ${JSON.stringify(property.getRepositoryValue())}`)
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})