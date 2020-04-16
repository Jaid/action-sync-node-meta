import {error as consoleError} from "@actions/core"

export default function logError(error) {
  if (error instanceof Error) {
    consoleError(error.toString())
  } else {
    consoleError(error)
  }
}