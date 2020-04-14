import fsp from "@absolunet/fsp"
import {debug, endGroup, info, setFailed, startGroup} from "@actions/core"
import {context} from "@actions/github"
import CommitManager from "commit-from-action"
import path from "path"
import purdy from "purdy"
import readFileJson from "read-file-json"
import zahl from "zahl"

import DescriptionProperty from "lib/DescriptionProperty"
import HomepageProperty from "lib/HomepageProperty"

import pullBody from "./pullBody.hbs"

async function main() {
  const pkgFile = path.resolve("package.json")
  let pkg = await readFileJson(pkgFile)
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
  const commitManager = new CommitManager({
    autoApprove: "approve",
    autoRemoveBranch: "removeBranch",
    branchPrefix: "fix-",
    pullRequestTitle: manager => `Applied ${zahl(manager.commits, "fix")} from jaid/action-sync-node-meta`,
    pullRequestBody: manager => pullBody({
      ...context.repo,
      sha7: context.sha?.slice(0, 8),
      autoApprove: manager.autoApprove,
      sha: context.sha,
      actionRepo: "Jaid/action-sync-node-meta",
      actionPage: "https://github.com/marketplace/actions/sync-node-meta",
      branch: manager.branch,
    }),
    mergeMessage: manager => `Automatically merged Node metadata update from #${manager.pullNumber}`,
  })
  const changes = []
  for (const property of properties) {
    const title = property.getTitle()
    const pkgKey = property.getPkgKey()
    const pkgValue = property.getPkgValue()
    const repositoryKey = property.getRepositoryKey()
    const repositoryValue = property.getRepositoryValue()
    const isEqual = property.compare(pkgValue, repositoryValue)
    if (!isEqual) {
      pkg = property.applyUpdate(pkg, repositoryValue)
      changes.push(1)
    }
    startGroup(title)
    info(`pkg.${pkgKey}: ${purdy.stringify(pkgValue)}`)
    info(`repository.${repositoryKey}: ${purdy.stringify(repositoryValue)}`)
    if (!isEqual) {
      info(`They are not equal! Updating pkg.${property.getPkgKey()} value.`)
    }
    endGroup()
  }
  if (changes.length) {
    await fsp.outputJson(pkgFile, pkg)
    await commitManager.push()
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})