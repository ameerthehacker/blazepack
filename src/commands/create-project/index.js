const {
  logInfo,
  logError,
  logSuccess,
  getSandboxFiles,
  createSandboxFiles,
} = require("../../utils");
const startDevServer = require('../start-dev-server');
const path = require('path');

async function createProject({ projectName, templateId, startServer, port }) {
  try {
    const projectPath = path.join(process.cwd(), projectName);

    logInfo(`📥 Downloading template...`); 
    const res = await getSandboxFiles(templateId);
    logInfo("📁 Creating files & directories");
    await createSandboxFiles(res.data, projectName);
    logSuccess("✅ Project created");
    
    if (startServer) {
      logInfo(`🚀 Starting project ${projectName}...`);
      startDevServer(projectPath, port);
    }
  } catch (err) {
    logError(`😢 Unable to create new project: ${err}`);
  }
}

module.exports = createProject;
