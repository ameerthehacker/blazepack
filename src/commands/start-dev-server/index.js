const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { WS_EVENTS, MIME_TYPES } = require('../../constants');
const chokidar = require('chokidar');
const openBrowser = require('../../open-browser');
const {
  logError,
  logInfo,
  getExtension,
  readSandboxFromFS,
  getPosixPath
} = require('../../utils');
const { blue, underline } = require('chalk');

let sandboxFiles;

function startDevServer({ directory, port, openInBrowser }) {
  const ROOT_DIR = path.join(__dirname, '..', '..');
  const WWW_PATH = path.join(ROOT_DIR, 'client', 'www');
  const INDEX_HTML_PATH = path.join(WWW_PATH, 'index.html');
  const isSandpackAvailableLocally = process.env.SANDPACK_LOCAL;
  const assetExistsInStaticPath = (url) => {
    const assetPath = path.join(WWW_PATH, url);

    return fs.existsSync(assetPath);
  }
  const sendIndexHTML = (res) => {
    const indexHTMLContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    res.write(indexHTMLContent);
    res.end();
  }
 
  const localSandpackServer = (req, res) => {
    const filename = path.basename(req.url);
    const ext = getExtension(filename);
    const isSvg = ext === 'svg';

    if (isSvg) {
      const svgContent = sandboxFiles[req.url] && sandboxFiles[req.url].code;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.write(svgContent);
      res.end();

      return;
    }
    else if (req.url === '/') {
      sendIndexHTML(res);
    } else if (req.url === '/index.js') {
      const clientJSPath = path.join(ROOT_DIR, 'lib', 'index.js');
      const assetContent = fs.readFileSync(clientJSPath, 'utf-8');
      res.setHeader('Content-Type', 'text/javascript');

      res.write(assetContent);
      res.end();
    } else {
      if (assetExistsInStaticPath(req.url)) {
        const assetPath = path.join(WWW_PATH, req.url);
        const assetContent = fs.readFileSync(assetPath, 'utf-8');

        res.setHeader('Content-Type', 'text/javascript');
        res.write(assetContent);
        res.end();
      } else {
        sendIndexHTML(res);
      }
    }
  };

  const selfHostedSandpackServer = (req, res) => {
    /**
     * Serve client/index.js for updating on websockets events.
     */
    if (req.url === '/index.js') {
      const clientJSPath = path.join(ROOT_DIR, 'lib', 'index.js');
      const assetContent = fs.readFileSync(clientJSPath, 'utf-8');

      res.setHeader('Content-Type', 'text/javascript');
      res.write(assetContent);
      res.end();

      return;
    } 

    let url;
    const hostedSandboxAssetExtensions = ["js", "html", "css", "json", "map"];

    const filename = path.basename(req.url);
    const ext = getExtension(filename);

    /**
     * Serve index.html, on root url.
     * if / is requested or if the resource does not have an extension always return index.html
     */
    if (req.url === '/' || !ext) {
      url = "/index.html";
    } else {
      url = req.url;
    }

    if (url === '/index.html' || hostedSandboxAssetExtensions.includes(ext)) {
      /**
       * Proxy all requests which access sandpack assets.
       * We host our bundler with unpkg, which will cache all deps
       * and bundling files.
       */
      const options = {
        hostname: "www.unpkg.com",
        path: `/blazepack-core@0.0.2/www${url}`,
        method: req.method,
      };

      const proxyReq = https.request(options, function (proxyRes) {
        let body = "";

        proxyRes.on("data", function (chunk) {
          body += chunk;
        });

        proxyRes.on("end", function () {
          const statusCode = proxyRes.statusCode;
          const shouldCache = statusCode === 200 && url !== '/index.html';
          const headers = shouldCache? proxyRes.headers: {...proxyRes.headers, 'cache-control': 'no-cache'};

          res.writeHead(statusCode, headers);
          res.end(body);
        });
      });
      proxyReq.end();
    } else {
      /** 
       * This will work for svgs, or any other assets not hosted by sandpack.
       */
      const mimeType =  MIME_TYPES[ext];

      if (!mimeType) {
        logError("We don't support this file extension. Please create an issue to add the support for the file.");
      }

      res.setHeader("Content-Type", mimeType || "text/plain");

      const assetPath = path.join(directory, req.url);

      if (fs.existsSync(assetPath)) {
        const assetContent = fs.readFileSync(assetPath);
        res.write(assetContent);
      } else {
        res.writeHead(404);
      }

      res.end();
    }
  };

  const httpServer = http.createServer(isSandpackAvailableLocally ? localSandpackServer : selfHostedSandpackServer);
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (ws) => {
    sandboxFiles = readSandboxFromFS(directory);

    ws.send(JSON.stringify({
      type: WS_EVENTS.INIT,
      data: sandboxFiles
    }));

    ws.on('message', (evt) => {
      const { type, data } = JSON.parse(evt);
      const { title, message } = data;

      switch (type) {
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
        const devServerURL = blue(underline(`http://localhost:${port}`));

        console.log(`⚡ Blazepack dev server running at ${devServerURL}`);
        if(openInBrowser) openBrowser(`http://localhost:${port}`);
      })
      .on('all', (event, filePath) => {
        const relativePath = `/${getPosixPath(path.relative(directory, filePath))}`;
        let fileContent;

        if (event !== 'unlink' && event !== 'unlinkDir' && event !== 'addDir') {
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
        logError(`😢 Unexpected error occured in the dev server: ${err.message}`);
      }
    });
  }
}

module.exports = startDevServer;
