const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const getLatestPackageVersion = require('latest-version');
const os = require('os');

async function getTemplateURL(template) {
  const version = await getLatestPackageVersion('blazepack-templates');

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
        response.pipe(tempFile)
        .on('finish', () => {
          resolve(tempFileName);
        })
        .on('error', (err) => {
          resolve(`failed to extract template ${err}`);
        });
      } else {
        reject(`failed to download template from ${url}`);
      }
    });
  });
}

module.exports = {
  getTemplateURL,
  generateRandomHash,
  downloadFileToTemp
};
