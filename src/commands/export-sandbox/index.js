const { readSandboxFromFS, logError, logInfo, logSuccess } = require('../../utils');
const https = require('https');

function exportSandbox(directory) {
  const sandboxFiles = readSandboxFromFS(directory, true);
  const payload = JSON.stringify({
    files: sandboxFiles
  });

  logInfo(`📡  Sending files to codesandbox.io`);

  const req = https.request({
    host: 'codesandbox.io',
    path: '/api/v1/sandboxes/define?json=1',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  }, (res) => {
    let data = '';

    res.on('data', (chunk) => data += chunk);

    res.on('end', () => {
      const { sandbox_id } = JSON.parse(data);

      logSuccess(`✅ Sanbox created and available at https://codesandbox.io/s/${sandbox_id}`);
    });
  });

  req.on('error', (err) => {
    logError(`Unable to export to sandbox: ${err}`);
  })

  req.write(payload);
  req.end();
}

module.exports = exportSandbox;

