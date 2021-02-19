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

function getPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
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

function downloadSandboxFiles(id) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://codesandbox.io/api/v1/sandboxes/${id}`,
      (response) => {
        if (response.statusCode == 200) {
          let data = ''
          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            resolve(JSON.parse(data));
          })
        } else {
          reject(`failed to download sandbox for ${id}`);
        }
      }
    );
  });
}

async function createDirectories ({directories, name}) {
   const projectPath = path.join(process.cwd(), name);

  if (fs.existsSync(projectPath)) {
    logError(`Sorry a directory with name ${projectName} already exists!`);
    
    process.exit(1);
  }
   fs.mkdirSync(projectPath);


   Object.values(directories).forEach(async dir => {

   })

   console.log("Heree", projectPath)
}

async function createSandboxClone (sandboxInfo) {

  const directories = sandboxInfo.directories.reduce(
    (agg, directory) => ({
      ...agg,
      [directory.shortid]: {
        directory_shortid: directory.directory_shortid,
        title: directory.title,
      },
    }),
    {}
  );

  const getFolderName = (id, currentDir = "") => {
    if (!id || !directories[id]) {
      return currentDir;
    }

    if (directories[id].directory_shortid) {
      return getFolderName(
        directories[id].directory_shortid,
        `${directories[id].title}/${currentDir}`
      );
    }

    return `${directories[id].title}/${currentDir}`;
  };

  const directoriesWithPath = Object.keys(
    directories
  ).reduce((agg, dir) => {
    return { ...agg, [dir]: getFolderName(dir) };
  }, {});
  
  const projectPath = path.join(
    process.cwd(),
    sandboxInfo.title || sandboxInfo.id
  );

   Object.keys(directoriesWithPath).forEach(async (dir) => {
     await fs.mkdirSync(`${projectPath}/${directoriesWithPath[dir]}`, {
       recursive: true,
     });
   });


   sandboxInfo.modules.forEach(async module => {
     if (module.directory_shortid) {
       await fs.writeFileSync(
         `${projectPath}/${directoriesWithPath[module.directory_shortid]}${module.title}`, module.code
       );
     } else {
       await fs.writeFileSync(
         `${projectPath}/${
           module.title
         }`,
         module.code
       );
     }
   });


   logInfo("💣 Sandbox Cloned");
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
  downloadFileToTemp,
  getPosixPath,
  downloadSandboxFiles,
  createSandboxClone
};
