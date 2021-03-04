const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { WS_EVENTS, MIME_TYPES } = require('../../constants');
const chokidar = require('chokidar');
const openBrowser = require('../../open-browser');
const Stream = require('stream').Transform;
const {
  logError,
  logInfo,
  getExtension,
  readSandboxFromFS,
  getPosixPath,
  detectTemplate,
} = require('../../utils');
const { blue, underline } = require('chalk');
const npm = require('../../npm');
const request = require('../../request');
const matchAll = require('match-all');

let sandboxFiles;

function startDevServer({ directory, port, openInBrowser = true }) {
  try {
    detectTemplate(directory);
  } catch (err) {
    logError(`😢 ${err}`);

    process.exit(1);
  }

  const ROOT_DIR = path.join(__dirname, '..', '..');
  const WWW_PATH = path.join(ROOT_DIR, 'client', 'www');
  const INDEX_HTML_PATH = path.join(WWW_PATH, 'index.html');
  const isSandpackAvailableLocally = process.env.SANDPACK_LOCAL;
  const npmRegistries = npm.getRegistries(directory);
  const assetExistsInStaticPath = (url) => {
    const assetPath = path.join(WWW_PATH, url);

    return fs.existsSync(assetPath);
  };
  const sendIndexHTML = (res) => {
    const indexHTMLContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    res.write(indexHTMLContent);
    res.end();
  };

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
    } else if (req.url === '/') {
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

  const selfHostedSandpackServer = async (req, res) => {
    // handle private npm registries
    if (/^\/npm\/(.*)/gi.test(req.url)) {
      const [package, version] = matchAll(req.url, /^\/npm\/(.*)/gi)
        .toArray()[0]
        .split('/');
      const [scope] = package.split('%2f');
      const registryConfig = npmRegistries.find((npmRegistry) =>
        npmRegistry.scopes.includes(scope)
      );

      // we could not find that registry in npm
      if (!registryConfig) {
        res.writeHead(404);
        res.end();

        return;
      }

      const registryURL = registryConfig.registry;

      if (/^\/npm\/(.*)\/(.*)$/.test(req.url)) {
        try {
          const { body: packageInfo } = await request.get(
            `${registryURL}/${package}/${version}`,
            {
              Authorization: `Bearer ${registryConfig.token}`,
            }
          );

          const tarballURL = JSON.parse(packageInfo).dist.tarball;

          const { body: packageTar, response: registryRes } = await request.get(
            tarballURL,
            {
              Authorization: `Bearer ${registryConfig.token}`,
            }
          );

          if (registryRes.statusCode === 200) {
            res.writeHead(registryRes.statusCode, registryRes.headers);
            res.end(packageTar);
          } else {
            res.writeHead(404, registryRes.headers);
            res.end();
          }
        } catch (err) {
          res.writeHead(404);
          res.end();

          logError(
            `Unable to download tarball of npm package ${package}@${version}: ${err}`
          );
        }
      } else if (/^\/npm\/(.*)$/.test(req.url)) {
        try {
          const {
            body: packageInfo,
            response: registryRes,
          } = await request.get(`${registryURL}/${package}`, {
            Authorization: `Bearer ${registryConfig.token}`,
          });

          if (registryRes.statusCode === 200) {
            res.writeHead(registryRes.statusCode, registryRes.headers);
            res.end(packageInfo);
          } else {
            res.writeHead(404, registryRes.headers);
            res.end();
          }
        } catch (err) {
          res.writeHead(404);
          res.end();

          logError(`Unable to fetch package info of ${package}: ${err}`);
        }
      }

      return;
    }

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
    const hostedSandboxAssetExtensions = ['js', 'html', 'css', 'json', 'map'];

    const filename = path.basename(req.url);
    const ext = getExtension(filename);

    /**
     * Serve index.html, on root url.
     * if / is requested or if the resource does not have an extension always return index.html
     */
    if (req.url === '/' || !ext) {
      url = '/index.html';
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
        hostname: 'www.unpkg.com',
        path: `/blazepack-core@0.0.2/www${url}`,
        method: req.method,
      };

      const proxyReq = https.request(options, function (proxyRes) {
        let body = new Stream();

        proxyRes.on('data', function (chunk) {
          body.push(chunk);
        });

        proxyRes.on('end', function () {
          const statusCode = proxyRes.statusCode;
          const shouldCache = statusCode === 200 && url !== '/index.html';
          const headers = shouldCache
            ? proxyRes.headers
            : { ...proxyRes.headers, 'cache-control': 'no-cache' };

          res.writeHead(statusCode, headers);
          res.end(body.read());
        });
      });
      proxyReq.end();
    } else {
      /**
       * This will work for svgs, or any other assets not hosted by sandpack.
       */
      const mimeType = MIME_TYPES[ext];

      if (!mimeType) {
        logError(
          "We don't support this file extension. Please create an issue to add the support for the file."
        );
      }

      res.setHeader('Content-Type', mimeType || 'text/plain');

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

  const httpServer = http.createServer(
    isSandpackAvailableLocally ? localSandpackServer : selfHostedSandpackServer
  );
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (ws) => {
    sandboxFiles = readSandboxFromFS(directory);

    ws.send(
      JSON.stringify({
        type: WS_EVENTS.INIT,
        data: {
          files: sandboxFiles,
          registryScopes: npmRegistries.map(
            (npmRegistry) => npmRegistry.scopes
          ),
        },
      })
    );

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

          logInfo('Terminating the server');
          httpServer.close();
          process.exit(1);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    chokidar
      .watch(directory, { ignoreInitial: true })
      .on('ready', () => {
        const devServerURL = blue(underline(`http://localhost:${port}`));

        console.log(`⚡ Blazepack dev server running at ${devServerURL}`);
        if (openInBrowser) openBrowser(`http://localhost:${port}`);
      })
      .on('all', (event, filePath) => {
        const relativePath = `/${getPosixPath(
          path.relative(directory, filePath)
        )}`;
        let fileContent;

        if (event !== 'unlink' && event !== 'unlinkDir' && event !== 'addDir') {
          fileContent = fs.readFileSync(filePath, 'utf-8');
        }

        wsServer.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              type: WS_EVENTS.PATCH,
              data: {
                event,
                path: relativePath,
                fileContent,
              },
            })
          );
        });
      });
  });

  if (process.env.NODE_ENV !== 'development') {
    process.on('uncaughtException', (err) => {
      if (err.errno === 'EADDRINUSE') {
        logError(
          `😢 Unable to start blazepack dev server, port ${port} is already in use`
        );
      } else {
        logError(
          `😢 Unexpected error occured in the dev server: ${err.message}`
        );
      }
    });
  }
}

module.exports = startDevServer;
