const http = require('http');
const https = require('https');
const Stream = require('stream').Transform;

function get(url, headers) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const port = urlObj.port;
  const path = urlObj.pathname;
  const protocol = urlObj.protocol;
  const httpOrHttps = protocol === 'https:' ? https : http;

  const options = {
    hostname,
    path,
    port,
    method: 'GET',
    port,
    headers,
  };

  return new Promise((resolve) => {
    const req = httpOrHttps.request(options, (res) => {
      let data = new Stream();

      res.on('data', (chunk) => data.push(chunk));

      res.on('end', () => {
        resolve({ body: data.read(), response: res });
      });
    });

    req.end();
  });
}

module.exports = {
  get,
};
