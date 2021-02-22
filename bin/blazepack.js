#!/usr/bin/env node
const parseArgs = require('minimist');
const createProject = require('../src/commands/create-project');
const installPackage = require('../src/commands/install-package');
const startDevServer = require('../src/commands/start-dev-server');
const cloneSandbox = require('../src/commands/clone-sandbox');
const { version } = require('../package.json');
const { logError, logInfo } = require('../src/utils');

const args = parseArgs(process.argv.slice(2));
const commandOrDirectory = args._[0] || process.cwd();
const DEFAULT_PORT = 3000;
const PORT = args.port || DEFAULT_PORT;

function validateNewProject(projectName, template) {
  const officialTemplates = {
    react: "new",
    vanilla: "vanilla",
    preact: "preact",
    vue2: "vue",
    vue3: "vue-3",
    angular: "angular",
    svelte: "svelte",
  };

  const availableTemplates = Object.keys(officialTemplates).join(", ");

  if (!projectName) {
    logError(`Required argument project name was not provied`);

    process.exit(1);
  }

  if (!template) {
    logInfo('No template was provided using the default template react');

    template = 'react';
  }


  if (!officialTemplates[template]) {
    logError(
      `Unknown template ${template}, available options are ${availableTemplates}`
    );

    process.exit(1);
  }

  return officialTemplates[template];
}

if (args.version) {
  console.log(`v${version}`);
} else {
  switch (commandOrDirectory) {
    case "install": {
      const package = args._[1];

      if (!package) {
        logError(`Required argument package name was not provied`);

        process.exit(1);
      }

      installPackage(package);
      break;
    }
    case "create": {
      const projectName = args._[1];
      const template = args.template;
      
      const templateId = validateNewProject(projectName, template);

      createProject({
        projectName,
        templateId,
        startServer: false,
        port: PORT,
      });

      break;
    }
    case "start": {
      const projectName = args._[1];
      const template = args.template;

      const templateId = validateNewProject(projectName, template);

      createProject({ projectName, templateId, startServer: true, port: PORT });

      break;
    }
    case "clone": {
      const potentialSandboxIdentifier = args._[1];

      if (!potentialSandboxIdentifier) {
        logError(`Required argument; sandbox id or url was not provided`);
        process.exit(1);
      }

      let sandboxId = potentialSandboxIdentifier;

      try {
        /**
         * Sample URLs for Sandbox:
         * https://codesandbox.io/s/unique_id or https://codesandbox.io/embed/unique_id
         */
        const url = new URL(potentialSandboxIdentifier);
        const potentialSandboxId = url.pathname.split('/')[2];
        if (potentialSandboxId) {
          sandboxId = potentialSandboxId;
        } else {
          logError("Please make sure the URL is correct");
          process.exit(1);
        }
      } catch(e) {
        /**
         * Argument passed is not URL so we suppose it to be id.
         * If it is invalid Sandbox API will throw error
         */
      }

      cloneSandbox({ id: sandboxId });
      break;
    }
    default: {
      startDevServer(commandOrDirectory, PORT);
    }
  }
}
