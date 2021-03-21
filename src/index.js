/**
 * API to use blazepack inside node scripts
 */
const startDevServer = require('./commands/start-dev-server');
const createProject = require('./commands/create-project');
const exportSandbox = require('./commands/export-sandbox');
const { TEMPLATES } = require('./constants');
const { detectTemplate } = require('./utils');

module.exports = {
  commands: {
    startDevServer,
    createProject,
    exportSandbox,
  },
  utils: {
    detectTemplate,
  },
  constants: {
    TEMPLATES,
  },
};
