const consola = require("consola");

module.exports = {
  error
}

/**
 * Show error message then exit with exit code
 * @param {string} message
 * @param {number} [code]
 * @return void
 */
function error(message, code = 1) {
  consola.error(message);
  process.exit(code)
}
