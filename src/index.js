import fsp from "@absolunet/fsp"
import {debug, endGroup, getInput, info, setFailed, startGroup} from "@actions/core"
import {context, GitHub} from "@actions/github"
import CommitManager from "commit-from-action"
import detectIndent from "detect-indent"
import getBooleanActionInput from "get-boolean-action-input"
import hasContent from "has-content"
import path from "path"
import purdy from "purdy"
import readFileString from "read-file-string"
import zahl from "zahl"

import chalk from "lib/chalk"
import DescriptionProperty from "lib/DescriptionProperty"
import HomepageProperty from "lib/HomepageProperty"
import KeywordsProperty from "lib/KeywordsProperty"
import logError from "lib/logError"

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
  const results = []
  for (const property of properties) {
    const title = property.getTitle()
    const result = {
      title,
    }
    results.push(result)
    try {
      const pkgKey = property.getPkgKey()
      const pkgValue = property.getPkgValue()
      const repositoryKey = property.getRepositoryKey()
      const repositoryValue = property.getRepositoryValue()
      const isEqual = property.compare(pkgValue, repositoryValue)
      Object.assign(result, {
        pkgKey,
        pkgValue,
        repositoryKey,
        repositoryValue,
        isEqual,
      })
      if (!isEqual) {
        if (overwriteFile) {
          pkg = property.applyPkgUpdate(pkg, repositoryValue)
        } else {
          await property.applyGithubUpdate(octokit, context.repo, pkgValue)
        }
      }
    } catch (error) {
      result.error = error
      syncFailed = true
    }
  }
  const changedResults = results.filter(result => !result.isEqual)
  if (overwriteFile && hasContent(changedResults)) {
    const indent = detectIndent(pkgString).indent || "    "
    const outputJson = JSON.stringify(pkg, null, indent)
    await fsp.outputFile(pkgFile, outputJson)
    const prefix = getInput("commitMessagePrefix") || ""
    const changesString = changedResults.map(result => result.pkgKey).join(", ")
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
  for (const result of results) {
    let color
    let suffix
    if (result.error) {
      color = chalk.bgRed
      suffix = "(failed)"
    } else if (result.isEqual) {
      color = chalk.bgYellow
      suffix = "(equal)"
    } else {
      color = chalk.bgGreen
      suffix = "(changed)"
    }
    startGroup(color(`${result.title} ${suffix}`.padEnd(40)))
    info(`${chalk.cyan(`pkg.${result.pkgKey}:`)} ${purdy.stringify(result.pkgValue)}`)
    info(`${chalk.cyan(`repository.${result.repositoryKey}:`)} ${purdy.stringify(result.repositoryValue)}`)
    if (result.error) {
      logError(result.error)
    } else if (result.isEqual) {
      info("These values seem to be the same")
    } else if (overwriteFile) {
      info(`They are not equal! Updated pkg.${result.pkgKey} value.`)
    } else {
      info(`They are not equal! Updating pkg.${result.repositoryKey} value.`)
    }
    endGroup()
  }
  if (syncFailed) {
    throw new Error("Syncing failed")
  }
}

main().catch(error => {
  setFailed("jaid/action-sync-node-meta threw an Error")
  logError(error)
})