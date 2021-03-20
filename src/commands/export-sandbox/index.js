const {
  readSandboxFromFS,
  logError,
  logInfo,
  logSuccess,
} = require('../../utils');
const https = require('https');
const open = require('open');
const { underline } = require('chalk');

const noop = () => null;

function exportSandbox({
  directory,
  openInBrowser,
  onSuccess = noop,
  onError = noop,
}) {
  const sandboxFiles = readSandboxFromFS(directory, true);
  const payload = JSON.stringify({
    files: sandboxFiles,
  });

  logInfo(`📡 Sending files to codesandbox.io`);

  const req = https.request(
    {
      host: 'codesandbox.io',
      path: '/api/v1/sandboxes/define?json=1',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    },
    (res) => {
      let data = '';

      res.on('data', (chunk) => (data += chunk));

      res.on('end', () => {
        try {
          const { sandbox_id } = JSON.parse(data);
          const sandboxURL = `https://codesandbox.io/s/${sandbox_id}`;

          logSuccess(
            `✅ Sanbox created and available at ${underline(sandboxURL)}`
          );

          if (openInBrowser) {
            open(sandboxURL);
          }

          onSuccess();
        } catch (err) {
          const errMsg = `Failed to export the project, codesandbox responded with: ${data}`;

          logError(errMsg);
          onError(
            `Failed to export the project, codesandbox responded with: ${data}`
          );
        }
      });
    }
  );

  req.on('error', (err) => {
    const errMsg = `Unable to export to sandbox: ${err}`;

    logError(errMsg);
    onError(errMsg);
  });

  req.write(payload);
  req.end();
}

module.exports = exportSandbox;
