const { red, blue, green } = require('chalk');
const https = require('https');
const findPackageJSON = require('find-package-json');
const detectIndent = require('detect-indent');
const fs = require('fs');
const path = require('path');
const Stream = require('stream').Transform;
const getAllFiles = require('get-all-files').default;
const { TEMPLATES } = require('../constants');

function logError(message) {
  console.error(red(message));
}

function logSuccess(message) {
  console.log(green(message));
}

function logInfo(message) {
  console.log(blue(message));
}

function logHelp(command) {
  const mainHelp = `
Usage:
  blazepack   [options]  <command>

Options:
  --version   Output the current version
  --port <p>  Specify port <p> for dev server
  --help      Provides help

Commands:
  start           Starts the dev server
  create          Create project from Template
  clone           Clone an existing codesandbox
  export          Export to codesandbox.io
  install         Install dependency
  add             Install dependency (alias for install)
  uninstall       Remove dependency
  remove          Remove dependency (alias for uninstall)
`;
  if (!command) {
    console.log(mainHelp);
  } else {
    switch (command) {
      case 'create':
        console.log(`
Usage: blazepack create <name> [--template=<template>][--open]
        
Create project with name <name> from Template <template>.
If the --template option is not specified you will get the
If the --open options is specified then dev server will be stated in the newly created project
list of available templates to select from. 

eg: blazepack create my-cra --template=react --open

List of available templates are:`);
        Object.keys(TEMPLATES).forEach((template) => {
          console.log(`  ${template}`);
        });
        break;
      case 'start':
        console.log(`
Usage: blazepack start [directory][--port=<port>]
        
Starts the dev server in the given directory
If no directory is specified then the current working directory is used
You can change the port on which the dev server runs using the --port option
`);
        break;
      case 'export':
        console.log(`
Usage: blazepack export [--open]

Export your current project to codesandbox.io & also open the newly
created sandbox in a browser tab if the --open option is specified.
`);
        break;
      case 'clone':
        console.log(`
Usage: blazepack clone <sandbox-url|sandbox-id|embed-url>

Clone the sandbox from the given sadbox url, id or embed-url
`);
        break;
      case 'install':
        console.log(`\nUsage: blazepack install <package>`);
      case 'add':
        if (command === 'add') {
          console.log(`\nUsage: blazepack add <package>`);
        }
        console.log(`
Quickly Install a new package (dependency).
It does not create node_modules so you are gonna save a lot of space.
The install & add command are both similar.

eg: blazepack install redux

# or

blazepack add redux
`);
        break;
      case 'uninstall':
        console.log(`\nUsage: blazepack uninstall <package>`);
      case 'remove':
        if (command === 'remove') {
          console.log(`\nUsage: blazepack remove <package>`);
        }
        console.log(`
Quickly Remove an unused package (dependency).
The uninstall & remove command are both similar.

eg: blazepack uninstall redux

# or

blazepack remove redux
`);
        break;
      default:
        console.log(`Error: unknown command '${command}'`);
        console.log(mainHelp);
        break;
    }
  }
}

function getExtension(filename) {
  const fileParts = filename.split('.');

  return fileParts.length > 1 ? fileParts[fileParts.length - 1] : null;
}

function isImage(filename) {
  const ext = getExtension(filename);
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

  return imageExtensions.includes(ext);
}

function getSandboxFiles(id) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://codesandbox.io/api/v1/sandboxes/${id}`, (response) => {
        if (response.statusCode == 200) {
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            resolve(JSON.parse(data));
          });
        } else {
          reject(`failed to download sandbox for ${id}`);
        }
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode == 200) {
          let data = new Stream();
          response.on('data', (chunk) => {
            data.push(chunk);
          });

          response.on('end', () => {
            resolve(data.read());
          });
        } else {
          reject(`failed to download image ${url}`);
        }
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

async function createSandboxFiles(sandboxInfo, projectName) {
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
  // create an empty dir for our project
  const projectDir = projectName || sandboxInfo.title || sandboxInfo.id;
  if (projectDir)
    fs.mkdirSync(projectName || sandboxInfo.title || sandboxInfo.id);

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
  const getFolderName = (id, currentDir = '') => {
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
  const projectPath = path.join(process.cwd(), projectDir);

  /**
   * Create all directories, recursive: true; forces the directory creation if not present
   */
  Object.keys(directoriesWithPath).forEach((dir) => {
    fs.mkdirSync(`${projectPath}/${directoriesWithPath[dir]}`, {
      recursive: true,
    });
  });

  /**
   * Create all files, with the code.
   */
  sandboxInfo.modules.forEach(async (module) => {
    // if it is a image we need to download it from codesandbox locally
    if (isImage(module.title)) {
      module.code = await downloadImage(module.code);
    }

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

const getPackageJSON = () => {
  const iterator = findPackageJSON();
  const nextPackageJSON = iterator.next();

  if (nextPackageJSON && nextPackageJSON.filename) {
    const packageJSONContent = fs.readFileSync(
      nextPackageJSON.filename,
      'utf-8'
    );

    const packageJSON = JSON.parse(packageJSONContent);

    return {
      file: nextPackageJSON.filename,
      indent: detectIndent(packageJSONContent).indent || 2,
      json: packageJSON,
    };
  }

  return null;
};

function getPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function readAsDataUrlSync(filePath) {
  const filename = path.basename(filePath);
  const ext = getExtension(filename);
  const fileContent = fs.readFileSync(filePath, 'base64');

  return `data:image/${ext};base64,${fileContent}`;
}

function readSandboxFromFS(directory, exportFormat = false) {
  const IGNORED_DIRECTORIES = [/node_modules/, /.git/, /.cache/];
  const IGNORED_FILES = [/yarn.lock/, /package-lock.json/, /.gitignore/];

  let sandboxFiles = {};
  // get all files in the dir except node modules
  const filePaths = getAllFiles.sync.array(directory, {
    resolve: true,
    isExcludedDir: (dirname) =>
      IGNORED_DIRECTORIES.find((excludedDir) => excludedDir.test(dirname)),
  });

  filePaths.forEach((filePath) => {
    // we don't want to read unnecessary huge files
    const isExcludedFile = IGNORED_FILES.find((excludedFile) =>
      excludedFile.test(filePath)
    );
    const filename = path.basename(filePath);

    if (isExcludedFile) return;

    const relativePath = getPosixPath(path.relative(directory, filePath));
    let fileContent;

    if (isImage(filename)) {
      fileContent = readAsDataUrlSync(filePath);
    } else {
      fileContent = fs.readFileSync(filePath, 'utf-8');
    }

    const sandboxFilePath = `/${relativePath}`;

    // we use the export format in the export sandbox command
    sandboxFiles[sandboxFilePath] = exportFormat
      ? {
          content: fileContent,
        }
      : {
          code: fileContent,
          path: sandboxFilePath,
        };
  });

  return sandboxFiles;
}

function hasDependency(packageJSON, dependency) {
  const dependencies = Object.keys(packageJSON.dependencies || {});
  const devDependencies = Object.keys(packageJSON.devDependencies || {});

  return (
    dependencies.includes(dependency) || devDependencies.includes(dependency)
  );
}

function detectTemplate(directory) {
  const sandboxConfig = path.join(directory, 'sandbox.config.json');
  const packageJSON = path.join(directory, 'package.json');

  if (!fs.existsSync(packageJSON) && !fs.existsSync(sandboxConfig)) {
    throw 'Unknown project template!';
  }

  if (fs.existsSync(sandboxConfig)) {
    try {
      const sandboxConfigContent = JSON.parse(fs.readFileSync(sandboxConfig));

      return sandboxConfigContent.template;
    } catch {
      throw 'Invalid sandbox.config.json';
    }
  }

  if (fs.existsSync(packageJSON)) {
    try {
      const packageJSONContent = JSON.parse(fs.readFileSync(packageJSON));

      if (hasDependency(packageJSONContent, 'react-scripts')) {
        return 'react';
      }
      if (hasDependency(packageJSONContent, 'svelte')) {
        return 'svelte';
      }
      if (hasDependency(packageJSONContent, 'parcel-bundler')) {
        return 'parcel';
      }
      if (hasDependency(packageJSONContent, 'preact')) {
        return 'preact';
      }
      if (hasDependency(packageJSONContent, '@vue/cli-service')) {
        return 'vue';
      }
      if (hasDependency(packageJSONContent, '@angular/core')) {
        return 'angular';
      }
      if (hasDependency(packageJSONContent, 'reason-react')) {
        return 'reason-reason';
      }
      if (hasDependency(packageJSONContent, '@dojo/cli')) {
        return 'dojo';
      }
      if (hasDependency(packageJSONContent, 'cx-react')) {
        return 'cxjs';
      }
    } catch {
      throw 'Invalid package.json';
    }

    throw 'Unknown project template!';
  }
}

module.exports = {
  logError,
  logInfo,
  logSuccess,
  logHelp,
  getSandboxFiles,
  createSandboxFiles,
  isImage,
  getExtension,
  getPackageJSON,
  readSandboxFromFS,
  getPosixPath,
  detectTemplate,
};
