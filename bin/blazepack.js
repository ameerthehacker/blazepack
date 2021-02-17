#!/usr/bin/env node
const parseArgs = require('minimist');
const startDevServer = require('../src');
const { version } = require('../package.json');

const args = parseArgs(process.argv.slice(2));
const directory = args._[0] || process.cwd();
const DEFAULT_PORT = 3000;
const PORT = args.port || DEFAULT_PORT;

if (args.version) {
  console.log(`v${version}`);
} else {
  startDevServer(directory, PORT);
}
