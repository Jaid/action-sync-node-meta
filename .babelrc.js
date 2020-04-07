const { default: configure } = require("babel-preset-jaid")

module.exports = api => configure(api, {minify: {removeConsole: false}})