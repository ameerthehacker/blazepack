const fs = require('fs');
const path = require('path');
const { logInfo, logError, logSuccess } = require("../../utils");
const {
  getSandboxFiles,
  createSandboxFiles,
} = require("../../utils/get-sandbox");
const startDevServer = require('../start-dev-server');

async function createProject({ projectName, templateId, startServer, port }) {
  try {
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      logError(`Sorry a directory with name ${projectName} already exists!`);

      process.exit(1);
    }

    logInfo(`📥 Downloading template...`); 
    const res = await getSandboxFiles(templateId);
    logInfo("📁 Creating files & directories");
    await createSandboxFiles(res.data, projectName);
    logSuccess("✅ Project created");
    
    if (startServer) {
      logInfo(`Starting project ${projectName}...`);
      startDevServer(projectPath, port);
    }
  } catch (err) {
    logError(`Unable to create new project: ${err}`);
  }
}

module.exports = createProject;
