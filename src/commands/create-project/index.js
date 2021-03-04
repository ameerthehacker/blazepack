const {
  logInfo,
  logError,
  logSuccess,
  getSandboxFiles,
  createSandboxFiles,
} = require('../../utils');
const startDevServer = require('../start-dev-server');
const path = require('path');

const noop = () => null;

async function createProject({
  projectName,
  templateId,
  startServer,
  port,
  onSuccess = noop,
  onError = noop,
}) {
  try {
    const projectPath = path.join(process.cwd(), projectName);

    logInfo(`📥 Downloading template...`);
    const res = await getSandboxFiles(templateId);
    logInfo('📁 Creating files & directories');
    await createSandboxFiles(res.data, projectName);
    logSuccess('✅ Project created');

    if (startServer) {
      logInfo(`🚀 Starting project ${projectName}...`);
      startDevServer({ directory: projectPath, port, onSuccess, onError });
    } else {
      onSuccess();
    }
  } catch (err) {
    logError(`Unable to create new project: ${err}`);
    onError(err);
  }
}

module.exports = createProject;
