const http = require('http');
const fs = require('fs');
const path = require('path');
const getAllFiles = require('get-all-files').default;
const WebSocket = require('ws');
const { WS_EVENTS } = require('./constants');
const chokidar = require('chokidar');
const open = require('open');
const { isImage, toDataUrl } = require('./utils');

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
        console.log(`😢 Unable to start blazepack dev server, port ${port} is already in use`);
      } else {
        console.log(`😢 Unable to start blazepack dev server: ${err.message}`);
      }
    });
  }
}

module.exports = startDevServer;
