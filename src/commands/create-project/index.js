const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../../utils');
const extractZip = require('extract-zip');
const { getTemplateURL, downloadFileToTemp } = require('./utils');

async function createProject({ projectName, template, startServer, port }) {
  try {
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      logError(`Sorry a directory with name ${projectName} already exists!`);

      process.exit(1);
    }

    logInfo(`Downloading the template ${template}...`)

    const templateURL = await getTemplateURL(template);
    const fileName = await downloadFileToTemp(templateURL);

    await extractZip(fileName, {
      dir: projectPath
    });

    if (startServer) startDevServer(projectPath, port);
  } catch (err) {
    logError(`Unable to create new project: ${err}`);
  }
}

module.exports = createProject;
