import {info, setFailed} from "@actions/core"
import {context} from "@actions/github"
import readFileJson from "read-file-json"

async function main() {
  const pkg = await readFileJson("package.json")
  if (!pkg) {
    info("No package.json found, skipping")
    return
  }
  info(JSON.stringify(context.payload.repository.description))
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})