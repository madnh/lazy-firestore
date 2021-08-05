const path = require('path');

function workingPath(...args) {
  return path.resolve(...[process.cwd(), ...args]);
}

module.exports = {
  workingPath
}
