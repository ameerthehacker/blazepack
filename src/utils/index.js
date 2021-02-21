const { red, blue, green } = require('chalk');

function logError(message) {
  console.log(red(message));
}

function logSuccess(message) {
  console.log(green(message));
}

function logInfo(message) {
  console.log(blue(message));
}

module.exports = {
  logError,
  logInfo,
  logSuccess,
};
