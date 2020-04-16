import {error as consoleError} from "@actions/core"

export default function logError(error) {
  if (typeof error === "string") {
    consoleError(error)
  } else {
    consoleError(`Error: ${error}`)
  }
}