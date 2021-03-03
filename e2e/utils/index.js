const { exec } = require('child_process');
const path = require('path');
const rm = require('rimraf');
const fs = require('fs');

const FIXTURE_PATH = path.join(process.cwd(), 'e2e', 'fixtures');

function runBlazepackCmd(cmd, cb) {
  const binScriptPath = path.join(process.cwd(), 'bin', 'blazepack.js');

  return exec(`node ${binScriptPath} --browser=none ${cmd}`, cb);
}

function startDevServer(directory) {
  return runBlazepackCmd(`start ${directory}`);
}

function createApp(projectName, template) {
  return new Promise((resolve) => {
    const childProcess = runBlazepackCmd(
      `create ${projectName} --template=${template}`
    );

    childProcess.on('exit', resolve);
  });
}

function waitFor(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function cleanFixtures() {
  return new Promise((resolve, reject) => {
    rm(FIXTURE_PATH, (err) => {
      fs.mkdirSync(FIXTURE_PATH);

      if (!err) resolve();
      else reject(err);
    });
    resolve();
  });
}

module.exports = {
  runBlazepackCmd,
  startDevServer,
  createApp,
  waitFor,
  cleanFixtures,
};
