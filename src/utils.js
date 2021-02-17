const fs = require('fs');
const path = require('path');
const { red, blue, green } = require('chalk');
const crypto = require('crypto');
const https = require('https');
const os = require('os');
const latestVersion = require('latest-version');

function getExtension(filename) {
  const [, ext] = filename.split('.');

  return ext;
}

function isImage(filename) {
  const ext = getExtension(filename);
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

  return imageExtensions.includes(ext)
}

function readAsDataUrlSync(filePath) {
  const filename = path.basename(filePath);
  const ext = getExtension(filename);
  const fileContent = fs.readFileSync(filePath, 'base64');

  return `data:image/${ext};base64,${fileContent}`;
}

function logError(message) {
  console.log(red(message));
}

function logSuccess(message) {
  console.log(green(message));
}

function logInfo(message) {
  console.log(blue(message));
}

async function getTemplateURL(template) {
  const version = await latestVersion('blazepack-templates');

  return `https://www.unpkg.com/blazepack-templates@${version}/templates/${template}.zip`;
}

function generateRandomHash() {
  const timeStamp = (new Date()).valueOf().toString();
  const random = Math.random().toString();

  return crypto.createHash('sha1').update(timeStamp + random).digest('hex');
}

function downloadFileToTemp(url) {
  const tempFileName = path.join(os.tmpdir(), `${generateRandomHash()}.zip`);
  const tempFile = fs.createWriteStream(tempFileName);

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode == 200) {
        response.pipe(tempFile);
        resolve(tempFileName);
      } else {
        reject(`failed to download template from ${url}`);
      }
    });
  });
}

module.exports = {
  isImage,
  toDataUrl: readAsDataUrlSync,
  getExtension,
  logError,
  logInfo,
  logSuccess,
  getTemplateURL,
  generateRandomHash,
  downloadFileToTemp
};
