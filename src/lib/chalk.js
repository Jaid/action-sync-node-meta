import chalk from "chalk"

// GitHub Actions CI supports color, chalk just does not know that
// So we force a certain chalk level
const customChalk = new chalk.Instance({
  level: 2,
})

export default customChalk