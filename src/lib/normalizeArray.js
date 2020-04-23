import {sortBy, uniq} from "lodash"

/**
 * @param {*} input
 */
export default input => {
  if (!Array.isArray(input)) {
    return input
  }
  return sortBy(uniq(input))
}