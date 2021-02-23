const path = require('path');
const fs = require('fs');
const { getExtension } = require('../../utils');

function getPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function readAsDataUrlSync(filePath) {
  const filename = path.basename(filePath);
  const ext = getExtension(filename);
  const fileContent = fs.readFileSync(filePath, 'base64');

  return `data:image/${ext};base64,${fileContent}`;
}

module.exports = {
  getPosixPath,
  readAsDataUrlSync
};
