import {error as consoleError} from "@actions/core"

/**
 * @param {Error|string} error
 */
export default function logError(error) {
  if (error instanceof Error) {
    consoleError(error.stack)
  } else {
    consoleError(error)
  }
}