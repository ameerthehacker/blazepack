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

function getSandboxFiles(id) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://codesandbox.io/api/v1/sandboxes/${id}`, (response) => {
        if (response.statusCode == 200) {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            resolve(JSON.parse(data));
          });
        } else {
          reject(`failed to download sandbox for ${id}`);
        }
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}

async function createSandboxFiles(sandboxInfo) {
  /** 
   * Object of all directories
   *
   * For eg:
   * {
   *    "a": {
   *      directory_shortid: "b", // components directory resides inside the directory with id `b`
   *      title: "components" // directory name
   *    },
   *    "b": {
   *      directory_shortid: null, // does not have parent directory
   *      title: "src"
   *    },
   * }
   *
   */
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

  /**
   * Get directory name recursively
   */
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

  /** 
   * Directories object with nested path
   *
   * {
   *    "a": "src/components/",
   *    "b": "src/",
   * }
   *
   */
  const directoriesWithPath = Object.keys(directories).reduce((agg, dir) => {
    return { ...agg, [dir]: getFolderName(dir) };
  }, {});

  /**
   * Project path with the sandbox name
   */
  const projectPath = path.join(
    process.cwd(),
    sandboxInfo.title || sandboxInfo.id
  );

  /** 
   * Create all directories, recursice: true; forces the directory creation if not present
   */
  Object.keys(directoriesWithPath).forEach(async (dir) => {
    await fs.mkdirSync(`${projectPath}/${directoriesWithPath[dir]}`, {
      recursive: true,
    });
  });

  /**
   * Create all files, with the code.
   */
  sandboxInfo.modules.forEach(async (module) => {
    if (module.directory_shortid) {
      await fs.writeFileSync(
        `${projectPath}/${directoriesWithPath[module.directory_shortid]}${
          module.title
        }`,
        module.code
      );
    } else {
      await fs.writeFileSync(`${projectPath}/${module.title}`, module.code);
    }
  });
}

module.exports = {
  isImage,
  toDataUrl: readAsDataUrlSync,
  getExtension,
  logError,
  logInfo,
  logSuccess,
  getPosixPath,
  getSandboxFiles,
  createSandboxFiles,
};
