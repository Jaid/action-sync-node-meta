import {debug, endGroup, info, setFailed, startGroup} from "@actions/core"
import {context} from "@actions/github"
import CommitManager from "commit-from-action"
import path from "path"
import purdy from "purdy"
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
    const title = property.getTitle()
    const pkgKey = property.getPkgKey()
    const pkgValue = property.getPkgValue()
    const repositoryKey = property.getRepositoryKey()
    const repositoryValue = property.getRepositoryValue()
    const isEqual = property.compare(pkgValue, repositoryValue)
    startGroup(title)
    info(`pkg.${pkgKey}: ${purdy.stringify(pkgValue)}`)
    info(`repository.${repositoryKey}: ${purdy.stringify(repositoryValue)}`)
    if (!isEqual) {
      info(`They are not equal! Updating pkg.${property.getPkgKey()} value.`)
    }
    endGroup()
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})