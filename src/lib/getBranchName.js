import {getInput} from "@actions/core"
import {customAlphabet} from "nanoid"

const idLength = 8
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", idLength)

const replacedToken = "{random}"

/**
 * @function
 * @return {string}
 */
export default () => {
  const input = getInput("branch")
  if (!input.includes(replacedToken)) {
    return input
  }
  const generatedId = nanoid()
  return input.replace(replacedToken, generatedId)
}