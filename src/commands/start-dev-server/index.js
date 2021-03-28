const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const {
  WS_EVENTS,
  MIME_TYPES,
  IGNORED_DIRECTORIES,
  IGNORED_FILES,
  NOOP,
  DEFAULT_PORT,
} = require('../../constants');
const chokidar = require('chokidar');
const openBrowser = require('../../open-browser');
const Stream = require('stream').Transform;
const {
  logError,
  logInfo,
  logVerbose,
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

function startDevServer({
  directory,
  port = DEFAULT_PORT,
  openInBrowser = true,
  onSuccess = NOOP,
  onError = NOOP,
}) {
  try {
    detectTemplate(directory);
  } catch (err) {
    logError(err);

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

  /**
   * when sandpack finds scoped private npm packages it would hit our local server
   * with /npm/@myorg%2fpackage
   * we will proxy that to private npm registry with secret token we got from .npmrc file
   * when sandpack hits as with /npm/@myorg%2fpackage/version
   * we will download the tarball from the private npm registry and provide it to sandbpack
   * none of the private package files leave the user's computer
   */
  const handlePrivateNpmPackages = async (req, res) => {
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
        const { body: packageInfo, response: registryRes } = await request.get(
          `${registryURL}/${package}`,
          {
            Authorization: `Bearer ${registryConfig.token}`,
          }
        );

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
  };

  const localSandpackServer = async (req, res) => {
    // handle private npm registries
    if (/^\/npm\/(.*)/gi.test(req.url)) {
      handlePrivateNpmPackages(req, res);

      return;
    }

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
      handlePrivateNpmPackages(req, res);

      return;
    }

    const filename = path.basename(req.url);
    const ext = getExtension(filename);
    let mimeType = MIME_TYPES[ext] || 'text/plain';
    let url;

    /**
     * Serve index.html, on root url.
     * if / is requested or if the resource does not have an extension always return index.html
     */
    if (req.url === '/' || !ext) {
      url = '/index.html';
      mimeType = 'text/html';
    } else {
      url = req.url;
    }

    res.setHeader('Content-Type', mimeType);

    const blazepackCoreVersion = '0.0.2';
    const indexHTMLContent = (
      await request.get(
        `https://www.unpkg.com/blazepack-core@${blazepackCoreVersion}/www/index.html`
      )
    ).body;

    if (url === '/index.html') {
      res.write(indexHTMLContent);
      res.end();

      return;
    }

    /**
     * Serve client/index.js for updating on websockets events.
     */
    if (req.url === '/index.js') {
      const clientJSPath = path.join(ROOT_DIR, 'lib', 'index.js');
      const assetContent = fs.readFileSync(clientJSPath, 'utf-8');

      res.write(assetContent);
      res.end();

      return;
    }

    /**
     * We first check whether the file is available in public folder first
     */
    const publicFilePath = path.join(directory, 'public', req.url);

    if (fs.existsSync(publicFilePath)) {
      res.write(fs.readFileSync(publicFilePath));
      res.end();

      return;
    }

    /**
     * This will work for svgs, or any other assets not hosted by sandpack.
     */
    const assetPath = path.join(directory, req.url);

    if (fs.existsSync(assetPath)) {
      const assetContent = fs.readFileSync(assetPath);
      res.write(assetContent);

      res.end();

      return;
    }

    /**
     * Proxy all requests which access sandpack assets.
     * We host our bundler with unpkg, which will cache all deps
     * and bundling files.
     */
    const options = {
      hostname: 'www.unpkg.com',
      path: `/blazepack-core@${blazepackCoreVersion}/www${url}`,
      method: req.method,
    };

    const proxyReq = https.request(options, function (proxyRes) {
      let body = new Stream();

      proxyRes.on('data', function (chunk) {
        body.push(chunk);
      });

      proxyRes.on('end', function () {
        const statusCode = proxyRes.statusCode;
        if (statusCode === 200) {
          res.writeHead(statusCode, proxyRes.headers);
          res.end(body.read());
        } else {
          res.write(indexHTMLContent);
          res.end();
        }
      });
    });
    proxyReq.end();
  };

  const httpServer = http.createServer(
    isSandpackAvailableLocally ? localSandpackServer : selfHostedSandpackServer
  );
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (ws) => {
    sandboxFiles = readSandboxFromFS(directory);

    logVerbose(`client connected`);

    const payload = {
      type: WS_EVENTS.INIT,
      data: {
        files: sandboxFiles,
        registryScopes: npmRegistries.map((npmRegistry) => npmRegistry.scopes),
        verbose: global.verbose,
      },
    };

    logVerbose(`sending payload: ${JSON.stringify(payload, null, 2)}`);

    ws.send(JSON.stringify(payload));

    ws.on('message', (evt) => {
      const { type, data } = JSON.parse(evt);
      const { title, message } = data;

      switch (type) {
        case WS_EVENTS.UNHANDLED_SANDPACK_ERROR: {
          logError(title);
          logError(message);

          logInfo('Terminating the server');
          httpServer.close();

          onError(`${title}: ${message}`);
          process.exit(1);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    logVerbose('starting to watch fs using chokidar...');

    chokidar
      .watch(directory, {
        ignoreInitial: true,
        ignored: (path) => {
          return (
            IGNORED_DIRECTORIES.find((IGNORED_DIRECTORY) =>
              IGNORED_DIRECTORY.test(path)
            ) || IGNORED_FILES.find((IGNORED_FILE) => IGNORED_FILE.test(path))
          );
        },
      })
      .on('ready', () => {
        const devServerURL = blue(underline(`http://localhost:${port}`));

        console.log(`⚡ Blazepack dev server running at ${devServerURL}`);
        if (openInBrowser) openBrowser(`http://localhost:${port}`);

        onSuccess(httpServer);
      })
      .on('all', (event, filePath) => {
        const relativePath = `/${getPosixPath(
          path.relative(directory, filePath)
        )}`;

        logVerbose(
          `fs change detected, event: ${event}, filePath: ${relativePath}`
        );

        let fileContent;

        if (event !== 'unlink' && event !== 'unlinkDir' && event !== 'addDir') {
          fileContent = fs.readFileSync(filePath, 'utf-8');

          logVerbose(`changed filecontent: ${fileContent}`);
        }

        const payload = {
          type: WS_EVENTS.PATCH,
          data: {
            event,
            path: relativePath,
            fileContent,
          },
        };

        logVerbose(`sending payload: ${JSON.stringify(payload, null, 2)}`);

        wsServer.clients.forEach((client) => {
          client.send(JSON.stringify(payload));
        });
      });
  });

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (err) => {
      onError(err);

      if (err.errno === 'EADDRINUSE') {
        logError(
          `Unable to start blazepack dev server, port ${port} is already in use`
        );
      } else {
        logError(`Unexpected error occured in the dev server: ${err.message}`);
      }
    });
  }
}

module.exports = startDevServer;
