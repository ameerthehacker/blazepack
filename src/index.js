const http = require('http');
const fs = require('fs');
const path = require('path');
const getAllFiles = require('get-all-files').default;
const WebSocket = require('ws');
const { WS_EVENTS } = require('./constants');
const chokidar = require('chokidar');
const open = require('open');
const { isImage, toDataUrl, logError, logSuccess, logInfo, getTemplateURL, downloadFileToTemp } = require('./utils');
const findPackageJSON = require('find-package-json');
const detectIndent = require('detect-indent');
const getLatestVersion = require('latest-version');
const extractZip = require('extract-zip');

async function createProject(projectName, template, startServer, port) {
 try {
  const projectPath = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    logError(`Sorry a directory with name ${projectName} already exists!`);
    
    process.exit(1);
  }

  logInfo(`Downloading the template ${template}...`)

  const templateURL = await getTemplateURL(template);
  const fileName = await downloadFileToTemp(templateURL);

  await extractZip(fileName, {
    dir: projectPath
  });

  if(startServer) startDevServer(projectPath, port);
 } catch(err) {
   console.log(`Unable to create new project: ${err}`);
 }
}

async function installPackage(package) {
  try {
    const [packageName, version] = package.split('@');
    const iterator = findPackageJSON();
    const nextPackageJSON = iterator.next();

    if (nextPackageJSON) {
      const packageJSONContent = fs.readFileSync(nextPackageJSON.filename, 'utf-8');
      const packageJSON = JSON.parse(packageJSONContent);
      const latestVersion = await getLatestVersion(packageName);
      const packageVersion = version || latestVersion;
  
      if (packageJSON.dependencies) {
        packageJSON.dependencies = {
          ...packageJSON.dependencies,
          [packageName]: `^${packageVersion}`
        }
      }
  
      // detectIntent keeps up the indentation of the original file preserved 
      fs.writeFileSync(nextPackageJSON.filename, JSON.stringify(packageJSON, null, detectIndent(packageJSONContent).indent || 2));

      logSuccess(`Installed package ${packageName}@${packageVersion}`);
    } else {
      logError('Unable to find package.json for the project');
    }
  } catch(err) {
    if (err.name === 'PackageNotFoundError')  {
      logError(`Unable to find package ${package} in the npm registry`);
    } else {
      logError(`Unable to install package ${package}: ${err}`);
    }
  }
}

function startDevServer(directory, port) {
  const EXCLUDED_DIRECTORIES = [
    /node_modules/,
    /.git/,
    /.cache/
  ];
  const EXCLUDED_FILES = [
    /yarn.lock/,
    /package-lock.json/,
    /.gitignore/
  ]
  const STATIC_PATH = path.join(__dirname, 'static');
  const INDEX_HTML_PATH = path.join(STATIC_PATH, 'index.html');
  const assetExistsInStaticPath = (url) => {
    const assetPath = path.join(STATIC_PATH, url);
  
    return fs.existsSync(assetPath);
  }
  const sendIndexHTML = (res) => {
    const indexHTMLContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  
    res.write(indexHTMLContent);
    res.end();
  }
  const getSandboxFiles = (directory) => {
    let sandboxFiles = {};
    // get all files in the dir except node modules
    const filePaths = getAllFiles.sync.array(directory, {
      resolve: true,
      isExcludedDir: (dirname) => EXCLUDED_DIRECTORIES.find(excludedDir => excludedDir.test(dirname))
    });
  
  
    filePaths.forEach(filePath => {
      // we don't want to read unneccessary huge files
      const isExcludedFile = EXCLUDED_FILES.find(excludedFile => excludedFile.test(filePath));
      const filename = path.basename(filePath);
  
      if (isExcludedFile) return;
  
      const relativePath = path.relative(directory, filePath);
      let fileContent;

      if (isImage(filename)) {
        fileContent = toDataUrl(filePath);
      } else {
        fileContent = fs.readFileSync(filePath, 'utf-8');
      }
  
      sandboxFiles[`/${relativePath}`] = {
        code: fileContent
      };
    });
  
    return sandboxFiles;
  }
  
  const httpServer = http.createServer((req, res) => {
    if (req.url === '/') {
      sendIndexHTML(res);
    } else {
      if (assetExistsInStaticPath(req.url)) {
        const assetPath = path.join(STATIC_PATH, req.url);
        const assetContent = fs.readFileSync(assetPath, 'utf-8');
  
        res.write(assetContent);
        res.end();
      } else {
        sendIndexHTML(res);
      }
    }
  });

  const wsServer = new WebSocket.Server({ server: httpServer });
  
  wsServer.on('connection', (ws) => {
    const sandboxFiles = getSandboxFiles(directory);
  
    ws.send(JSON.stringify({
      type: WS_EVENTS.INIT,
      data: sandboxFiles
    }));

    ws.on('message', (evt) => {
      const { type, data } = JSON.parse(evt);
      const { title, message } = data;

      switch(type) {
        case WS_EVENTS.ERROR: {
          logError(title);
          logError(message);
          
          break;
        }
        case WS_EVENTS.UNHANDLED_SANDPACK_ERROR: {
          logError(title);
          logError(message);

          logInfo("Terminating the server");
          httpServer.close();
          process.exit(1);
        }
      }
    });
  });


  httpServer.listen(port, () => {
    chokidar.watch(directory, { ignoreInitial: true })
    .on('ready', () => {
      console.log(`⚡ Blazepack dev server running at http://localhost:${port}`);
  
      open(`http://localhost:${port}`);
    })
    .on('all', (event, filePath) => {
      const relativePath = `/${path.relative(directory, filePath)}`;
      let fileContent;
  
      if (event !== 'unlink' && event !== 'unlinkDir') {
        fileContent = fs.readFileSync(filePath, 'utf-8');
      }
  
      wsServer.clients.forEach(client => {
        client.send(JSON.stringify({
          type: WS_EVENTS.PATCH,
          data: {
            event,
            path: relativePath,
            fileContent
          }
        }));
      });
    });
  });

  if (process.env.NODE_ENV !== 'development') {
    process.on('uncaughtException', (err) => {
      if (err.errno === 'EADDRINUSE') {
        logError(`😢 Unable to start blazepack dev server, port ${port} is already in use`);
      } else {
        logError(`😢 Unable to start blazepack dev server: ${err.message}`);
      }
    });
  }
}



module.exports = { startDevServer, installPackage, createProject };
