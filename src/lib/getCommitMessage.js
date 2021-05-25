import {getInput} from "@actions/core"

const replacedToken = "{changes}"

/**
 * @function
 * @param {string[]} changedKeys
 * @return {string}
 */
export default changedKeys => {
  const input = getInput("commitMessage")
  return input.replace(replacedToken, changedKeys.join(", "))
}