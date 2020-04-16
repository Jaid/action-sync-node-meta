import fsp from "@absolunet/fsp"
import {debug, endGroup, error as logError, getInput, info, setFailed, startGroup} from "@actions/core"
import {context, GitHub} from "@actions/github"
import CommitManager from "commit-from-action"
import detectIndent from "detect-indent"
import getBooleanActionInput from "get-boolean-action-input"
import hasContent from "has-content"
import path from "path"
import purdy from "purdy"
import readFileString from "read-file-string"
import zahl from "zahl"

import DescriptionProperty from "lib/DescriptionProperty"
import HomepageProperty from "lib/HomepageProperty"
import KeywordsProperty from "lib/KeywordsProperty"

import pullBody from "./pullBody.hbs"

const octokit = new GitHub(getInput("githubToken", {required: true}), {
  previews: ["mercy"], // mercy preview gives us topics
})

async function main() {
  let syncFailed = false
  // const syncingDirection = getInput("direction", {required: true}).toLowerCase()
  const syncingDirection = "overwrite-github"
  const overwriteFile = syncingDirection === "overwrite-file"
  info(`Syncing direction: ${syncingDirection}`)
  const pkgFile = path.resolve("package.json")
  const [repositoryResponse, pkgString] = await Promise.all([
    octokit.repos.get(context.repo),
    readFileString(pkgFile),
  ])
  if (!pkgString) {
    info("No package.json found, skipping")
    return
  }
  let pkg = JSON.parse(pkgString)
  debug(`Loaded ${zahl(pkg, "field")} from ${pkgFile}`)
  if (!context?.payload?.repository) {
    throw new Error("Could not fetch repository info from context.payload.repository")
  }
  const constructorContext = {
    repository: repositoryResponse.data,
    pkg,
  }
  /**
   * @type {import("lib/Property").default[]}
   */
  const properties = []
  const inputKeysForProperties = {
    syncDescription: DescriptionProperty,
    syncHomepage: HomepageProperty,
    syncKeywords: KeywordsProperty,
  }
  for (const [inputKey, PropertyClass] of Object.entries(inputKeysForProperties)) {
    const isIncluded = getBooleanActionInput(inputKey)
    if (isIncluded) {
      properties.push(new PropertyClass(constructorContext))
    }
  }
  if (properties.length === 0) {
    throw new Error("None of the sync properties is enabled!")
  }
  const changes = []
  for (const property of properties) {
    const title = property.getTitle()
    const pkgKey = property.getPkgKey()
    const pkgValue = property.getPkgValue()
    const repositoryKey = property.getRepositoryKey()
    const repositoryValue = property.getRepositoryValue()
    const isEqual = property.compare(pkgValue, repositoryValue)
    if (!isEqual) {
      changes.push({
        pkgKey,
        repositoryKey,
      })
      if (overwriteFile) {
        pkg = property.applyPkgUpdate(pkg, repositoryValue)
      } else {
        try {
          await property.applyGithubUpdate(octokit, context.repo, pkgValue)
        } catch (error) {
          logError(error)
          syncFailed = true
        }
      }
    }
    startGroup(title)
    info(`pkg.${pkgKey}: ${purdy.stringify(pkgValue)}`)
    info(`repository.${repositoryKey}: ${purdy.stringify(repositoryValue)}`)
    if (!isEqual) {
      info(`They are not equal! Updating pkg.${property.getPkgKey()} value.`)
    }
    endGroup()
  }
  if (overwriteFile && hasContent(changes)) {
    const indent = detectIndent(pkgString).indent || "    "
    const outputJson = JSON.stringify(pkg, null, indent)
    await fsp.outputFile(pkgFile, outputJson)
    const prefix = getInput("commitMessagePrefix") || ""
    const changesString = changes.map(change => change.pkgKey).join(", ")
    let commitManager
    try {
      commitManager = new CommitManager({
        autoApprove: "approve",
        autoRemoveBranch: "removeBranch",
        branchPrefix: "fix-",
        pullRequestTitle: "Applied a fix from action-sync-node-meta",
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
      await commitManager.push(`${prefix}Updated package.json[${changesString}]`)
    } catch (error) {
      logError(error)
      syncFailed = true
    } finally {
      await commitManager.finalize()
    }
  }
  if (syncFailed) {
    throw new Error("Syncing failed")
  }
}

main().catch(error => {
  setFailed("jaid/action-sync-node-meta threw an Error")
  logError(error)
})