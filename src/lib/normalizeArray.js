import {sortBy, uniq} from "lodash"

export default input => {
  if (!Array.isArray(input)) {
    return input
  }
  return sortBy(uniq(input))
}