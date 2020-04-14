import {setFailed} from "@actions/core"

async function main() {
  console.log("ABC")
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-sync-node-meta threw an Error")
})