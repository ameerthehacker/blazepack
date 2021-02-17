#!/usr/bin/env node
const parseArgs = require('minimist');
const { startDevServer, installPackage } = require('../src');
const { version } = require('../package.json');
const { logError } = require('../src/utils');

const args = parseArgs(process.argv.slice(2));
const commandOrDirectory = args._[0] || process.cwd();
const DEFAULT_PORT = 3000;
const PORT = args.port || DEFAULT_PORT;

if (args.version) {
  console.log(`v${version}`);
} else {
  switch (commandOrDirectory) {
    case 'install': {
      const package = args._[1];

      if (!package) {
        logError(`Required argument package name was not provied`);

        process.exit(1);
      }

      installPackage(package);
      break;
    }
    default: {
      startDevServer(commandOrDirectory, PORT);
    }
  }
}
