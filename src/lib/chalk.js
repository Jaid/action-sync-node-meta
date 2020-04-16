import chalk from "chalk"

// GitHub Actions CI supports color, chalk just does not know that
chalk.enabled = true
chalk.level = 2 // 256 colors

export default chalk