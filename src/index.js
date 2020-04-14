import {info, setFailed} from "@actions/core"
import readFileJson from "read-file-json"

async function main() {
  const pkg = await readFileJson("package.json")
  if (!pkg) {
    info("No package.json found, skipping")
    return
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})