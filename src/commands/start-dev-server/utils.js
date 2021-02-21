const path = require('path');
const fs = require('fs');

function isImage(filename) {
  const ext = getExtension(filename);
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

  return imageExtensions.includes(ext)
}

function getPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function readAsDataUrlSync(filePath) {
  const filename = path.basename(filePath);
  const ext = getExtension(filename);
  const fileContent = fs.readFileSync(filePath, 'base64');

  return `data:image/${ext};base64,${fileContent}`;
}

function getExtension(filename) {
  const fileParts = filename.split('.');

  return fileParts[fileParts.length - 1];
}

module.exports = {
  isImage,
  getPosixPath,
  readAsDataUrlSync,
  getExtension
};
