const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { WS_EVENTS } = require('../../constants');
const chokidar = require('chokidar');
const open = require('open');
const {
  logError,
  logInfo,
  getExtension,
  readSandboxFromFS,
  getPosixPath
} = require('../../utils');

let sandboxFiles;

function startDevServer(directory, port) {
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

  // we have our own sandpack hosted in unpkg for flexibility
  // we proxy all requests except /index.js file
  const selfHostedSandpackServer = (req, res) => {
    let url;

    if (req.url === '/') {
      url = '/index.html';
    } else if (req.url === '/index.js') {
      const clientJSPath = path.join(ROOT_DIR, 'lib', 'index.js');
      const assetContent = fs.readFileSync(clientJSPath, 'utf-8');

      res.setHeader('Content-Type', 'text/javascript');
      res.write(assetContent);
      res.end();

      return;
    } else {
      const filename = path.basename(req.url);
      const ext = getExtension(filename);

      // if it is an svg image send the svg content
      if (ext === 'svg') {
        const svgContent = sandboxFiles[req.url] && sandboxFiles[req.url].code;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.write(svgContent);
        res.end();

        return;
      }

      const hostedSandboxAssetExtensions = ['js', 'html', 'css', 'json'];

      if (hostedSandboxAssetExtensions.includes(ext)) {
        url = req.url;
      } else {
        url = '/index.html';
      }
    }

    const options = {
      hostname: 'www.unpkg.com',
      path: `/blazepack-core@0.0.2/www/${url}`,
      method: req.method
    };

    const proxyReq = https.request(options, function (proxyRes) {
      let body = '';

      proxyRes.on('data', function (chunk) {
        body += chunk;
      });

      proxyRes.on('end', function () {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(body);
      });
    });
    proxyReq.end();
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
        console.log(`⚡ Blazepack dev server running at http://localhost:${port}`);

        open(`http://localhost:${port}`);
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
        logError(`😢 Unable to start blazepack dev server: ${err.message}`);
      }
    });
  }
}

module.exports = startDevServer;
