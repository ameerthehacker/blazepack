/**
 * API to use blazepack inside node scripts
 */
const startDevServer = require('./commands/start-dev-server');
const createProject = require('./commands/create-project');
const { detectTemplate } = require('./utils');

const startDevServerPromisified = (options) =>
  new Promise((resolve, reject) => {
    startDevServer({ ...options, onSuccess: resolve, onError: reject });
  });

const createProjectPromisified = (options) =>
  new Promise((resolve, reject) => {
    createProject({ ...options, onSuccess: resolve, onError: reject });
  });

module.exports = {
  commands: {
    startDevServer: startDevServerPromisified,
    createProject: createProjectPromisified,
  },
  utils: {
    detectTemplate,
  },
};
