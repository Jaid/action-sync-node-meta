import path from "node:path"

import fsp from "@absolunet/fsp"
import {debug, endGroup, getInput, info, setFailed, startGroup} from "@actions/core"
import {context, getOctokit} from "@actions/github"
import CommitManager from "commit-from-action"
import detectIndent from "detect-indent"
import getActionBooleanInput from "get-boolean-action-input"
import hasContent from "has-content"
import purdy from "purdy"
import readFileString from "read-file-string"
import zahl from "zahl"

import chalk from "./lib/chalk.js"
import DescriptionProperty from "./lib/DescriptionProperty.js"
import getBranchName from "./lib/getBranchName.js"
import getCommitMessage from "./lib/getCommitMessage.js"
import HomepageProperty from "./lib/HomepageProperty.js"
import KeywordsProperty from "./lib/KeywordsProperty.js"
import logError from "./lib/logError.js"
import pullBody from "./pullBody.hbs"

const githubToken = getInput("githubToken", {required: true})
// TODO Is preview mercy still needed? It was needed in April 2020.
const octokit = getOctokit(githubToken, {
  previews: ["mercy"], // mercy preview gives us topics
}).rest

async function main() {
  let syncFailed = false
  const syncingDirection = getInput("direction", {required: true}).toLowerCase()
  const overwriteFile = syncingDirection === "overwrite-file"
  if (!overwriteFile && syncingDirection !== "overwrite-github") {
    throw new Error("Invalid direction input. Must be either \"overwrite-file\" or \"overwrite-github\".")
  }
  if (overwriteFile) {
    info("Syncing direction: GitHub repository info → package.json")
  } else {
    info("Syncing direction: package.json → GitHub repository info")
  }
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
  /**
   * @type {import("lib/Property").Repository}
   */
  const repository = repositoryResponse.data
  const constructorContext = {
    repository,
    pkg,
    overwriteFile,
  }
  const propertyClasses = [DescriptionProperty, HomepageProperty, KeywordsProperty]
  const properties = propertyClasses.map(PropertyClass => new PropertyClass(constructorContext))
  const enabledProperties = properties.filter(property => property.enabled)
  if (enabledProperties.length === 0) {
    throw new Error("None of the sync properties is enabled!")
  }
  const results = []
  for (const property of properties) {
    const title = property.getTitle()
    const result = {
      property,
      title,
    }
    results.push(result)
    try {
      const pkgKey = property.getPkgKey()
      const pkgValue = property.getPkgValue()
      const repositoryKey = property.getRepositoryKey()
      const repositoryValue = property.getRepositoryValue()
      Object.assign(result, {
        property,
        pkgKey,
        pkgValue,
        repositoryKey,
        repositoryValue,
        enabled: property.enabled,
      })
      if (!property.enabled) {
        continue
      }
      const isEqual = property.compare(pkgValue, repositoryValue)
      result.isEqual = isEqual
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
  const changedResults = results.filter(result => {
    if (!result.enabled) {
      return false
    }
    if (result.isEqual) {
      return false
    }
    return true
  })
  if (overwriteFile && hasContent(changedResults)) {
    const indent = detectIndent(pkgString).indent || "    "
    const json = JSON.stringify(pkg, null, indent)
    const jsonFinalNewline = getActionBooleanInput("jsonFinalNewline")
    const newContent = jsonFinalNewline ? `${json}\n` : json
    await fsp.outputFile(pkgFile, newContent)
    const changedKeys = changedResults.map(result => result.pkgKey)
    let commitManager
    try {
      commitManager = new CommitManager({
        autoApprove: "approve",
        autoRemoveBranch: "removeBranch",
        branch: getBranchName(),
        pullRequestTitle: "Applied a fix from action-sync-node-meta",
        commitMessage: getCommitMessage(changedKeys),
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
      await commitManager.push()
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
    if (!result.enabled) {
      color = chalk.bgGray
      suffix = "disabled"
    } else if (result.error) {
      color = chalk.bgRed
      suffix = "failed"
    } else if (result.isEqual) {
      color = chalk.bgYellow
      suffix = "equal"
    } else {
      color = chalk.bgGreen
      suffix = "changed"
    }
    startGroup(color(` ${result.title.padEnd(30 - suffix.length)}${suffix} `))
    const purdyOptions = {}
    info(`${chalk.cyan(`pkg.${result.pkgKey}:`)} ${purdy.stringify(result.pkgValue, purdyOptions)}`)
    info(`${chalk.cyan(`repository.${result.repositoryKey}:`)} ${purdy.stringify(result.repositoryValue, purdyOptions)}`)
    if (result.error) {
      logError(result.error)
    } else if (!result.enabled) {
      info("This sync has been disabled in workflow.")
    } else if (result.isEqual) {
      info("These values seem to be the same.")
    } else if (overwriteFile) {
      info(`They are not equal! Updated pkg.${result.pkgKey} value.`)
    } else {
      info(`They are not equal! Updating repository.${result.repositoryKey} value.`)
    }
    for (const logMessage of result.property.logMessages) {
      info(logMessage)
    }
    endGroup()
  }
  if (syncFailed) {
    throw new Error("Syncing failed")
  }
}

info(`${process.env.REPLACE_PKG_NAME} v${process.env.REPLACE_PKG_VERSION}`)

main().catch(error => {
  setFailed("jaid/action-sync-node-meta threw an Error")
  logError(error)
})