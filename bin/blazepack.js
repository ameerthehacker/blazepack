#!/usr/bin/env node
const parseArgs = require('minimist');
const { blue, underline } = require('chalk');
const updateNotifier = require('update-notifier');
const cliSelect = require('cli-select');
const path = require('path');
const fs = require('fs');
const createProject = require('../src/commands/create-project');
const installPackage = require('../src/commands/install-package');
const startDevServer = require('../src/commands/start-dev-server');
const cloneSandbox = require('../src/commands/clone-sandbox');
const removePackage = require("../src/commands/remove-package");
const exportSandbox = require("../src/commands/export-sandbox");
const pkg = require('../package.json');
const { logError, logInfo } = require('../src/utils');

// Checking for available updates
const notifier = updateNotifier({ pkg });
// Show update notification
notifier.notify({ isGlobal: true });

const args = parseArgs(process.argv.slice(2));
const commandOrDirectory = args._[0] || process.cwd();
const DEFAULT_PORT = 3000;
const PORT = args.port || DEFAULT_PORT;
const TEMPLATES = {
  static: "github/codesandbox-app/static-template/tree/master",
  react: "new",
  "react-ts": "react-typescript-react-ts",
  "react-native-web": "react-native-q4qymyp2l6",
  vanilla: "vanilla",
  preact: "preact",
  vue2: "vue",
  vue3: "vue-3",
  angular: "angular",
  svelte: "svelte",
  reason: "reason-reason",
  dojo: "github/dojo/dojo-codesandbox-template/tree/master",
  cxjs: "github/codaxy/cxjs-codesandbox-template/tree/master"
};

function validateNewProject(projectName, template) {
  const projectPath = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    logError(`😢 Sorry a directory with name ${projectName} already exists!`);

    process.exit(1);
  }

  const availableTemplates = Object.keys(TEMPLATES).join(", ");

  if (!projectName) {
    logError(`Required argument project name was not provided`);

    process.exit(1);
  }

  if (template && !TEMPLATES[template]) {
    logError(
      `Unknown template ${template}, available options are ${availableTemplates}`
    );

    process.exit(1);
  }

  return new Promise((resolve) => {
    if (!template) {
      logInfo('What template you want to use?');

      cliSelect({
        values: Object.keys(TEMPLATES),
        cleanup: true,
        selected: '👉',
        unselected: '  ',
        valueRenderer: (value, selected) => {
          if (selected) {
              return blue(underline(value));
          }
   
          return value;
        },
      }).then(answer => {
        logInfo(`🔨 Creating ${answer.value} based project...`);

        resolve(TEMPLATES[answer.value])
      }).catch(() => resolve(null));
    } else {
      resolve(TEMPLATES[template]);
    }
  });
}

if (args.version) {
  console.log(`v${pkg.version}`);
} else {
  switch (commandOrDirectory) {
    case "add":
    case "install": {
      const package = args._[1];

      if (!package) {
        logError(`Required argument package name was not provided`);

        process.exit(1);
      }

      installPackage(package);
      break;
    }
    case "uninstall":
    case "remove": {
      const package = args._[1];

      if (!package) {
        logError(`Required argument package name was not provided`);

        process.exit(1);
      }

      removePackage(package);
      break;
    }
    case "create": {
      const projectName = args._[1];
      const template = args.template;

      validateNewProject(projectName, template).then(templateId => {
        if (templateId) {
          createProject({
            projectName,
            templateId,
            startServer: false,
            port: PORT,
          });
        }
      });
 
      break;
    }
    case "start": {
      const projectName = args._[1];
      const template = args.template;

      validateNewProject(projectName, template).then(templateId => {
        if (templateId) {
          createProject({
            projectName,
            templateId,
            startServer: true,
            port: PORT,
          });
        }
      });

      break;
    }
    case "export": {
      const directory = args._[1] || process.cwd();
      const openInBrowser = args.open;

      exportSandbox({ directory, openInBrowser });

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
