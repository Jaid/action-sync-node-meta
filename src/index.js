import {debug, endGroup, info, setFailed, startGroup} from "@actions/core"
import {context} from "@actions/github"
import path from "path"
import readFileJson from "read-file-json"
import zahl from "zahl"

import DescriptionProperty from "lib/DescriptionProperty"
import HomepageProperty from "lib/HomepageProperty"

async function main() {
  const pkgFile = path.resolve("package.json")
  const pkg = await readFileJson("package.json")
  if (!pkg) {
    info("No package.json found, skipping")
    return
  }
  debug(`Loaded ${zahl(pkg, "field")} from ${pkgFile}`)
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
    startGroup(property.getTitle())
    info(`pkg[${property.getPkgKey()}]: ${JSON.stringify(property.getPkgValue())}`)
    info(`repository[${property.getRepositoryKey()}]: ${JSON.stringify(property.getRepositoryValue())}`)
    endGroup()
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})