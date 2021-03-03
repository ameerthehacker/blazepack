import { WS_EVENTS } from '../constants';
import { name } from '../../package.json';

const compile = window.compile;
const getSandboxTemplate = window.getTemplate;
const getTemplateDefinition = window.getTemplateDefinition;
const info = (message) => console.log(`${name}: ${message}`);
const ws = new WebSocket(`ws://${window.location.host}`);
let sandboxFiles;

ws.onopen = () => info('connected');

function getFilename(filePath) {
  const fileParts = filePath.split('/');
  const filename = fileParts[fileParts.length - 1];

  return filename;
}

export function getHTMLParts(html) {
  if (html.includes('<body>')) {
    const bodyMatcher = /<body.*>([\s\S]*)<\/body>/m;
    const headMatcher = /<head>([\s\S]*)<\/head>/m;

    const headMatch = html.match(headMatcher);
    const bodyMatch = html.match(bodyMatcher);
    const head = headMatch && headMatch[1] ? headMatch[1] : '';
    const body = bodyMatch && bodyMatch[1] ? bodyMatch[1] : html;

    return { body, head };
  }

  return { head: '', body: html };
}

function getSandboxTemplateName(sandboxFiles) {
  const packageJSON = JSON.parse(sandboxFiles['/package.json'].code);
  const sandboxTemplate = getSandboxTemplate(packageJSON, sandboxFiles);

  return sandboxTemplate;
}

ws.onmessage = (evt) => {
  const { type, data } = JSON.parse(evt.data);

  try {
    switch (type) {
      case WS_EVENTS.INIT: {
        sandboxFiles = data;
        const sandboxTemplate = getSandboxTemplateName(sandboxFiles);
        const sandboxTemplateDefinition = getTemplateDefinition(
          sandboxTemplate
        );
        // sandpack throws error for angular for some unknown reason
        const htmlEntryFiles =
          sandboxTemplateDefinition.name === 'angular-cli'
            ? ['/src/index.html']
            : sandboxTemplateDefinition.getHTMLEntries();

        for (const htmlEntryFile of htmlEntryFiles) {
          if (sandboxFiles[htmlEntryFile] && sandboxFiles[htmlEntryFile].code) {
            const htmlContent = sandboxFiles[htmlEntryFile].code;
            const { head } = getHTMLParts(htmlContent);

            document.head.innerHTML = head;
          }
        }

        compile({
          modules: sandboxFiles,
          codesandbox: true,
          externalResources: [],
          template: getSandboxTemplateName(sandboxFiles),
          isInitializationCompile: true,
        });

        break;
      }
      case WS_EVENTS.PATCH: {
        const { event, fileContent, path } = data;
        const filename = getFilename(path);

        // we need to reload so that sandpack can install the package
        if (filename === 'package.json') {
          window.location.reload();
        }

        // do a full page reload on new file or folder creation or deletion
        if (event === 'add' || event === 'unlink') {
          window.location.reload();
        }

        const updatedFiles = {
          ...sandboxFiles,
          [path]: { code: fileContent, path },
        };

        compile({
          modules: updatedFiles,
          codesandbox: true,
          externalResources: [],
          template: getSandboxTemplateName(updatedFiles),
        });

        break;
      }
    }
  } catch (e) {
    ws.send(
      JSON.stringify({
        type: WS_EVENTS.UNHANDLED_SANDPACK_ERROR,
        data: {
          title: 'Unhandled Sandpack error while running the app.',
          message: e.message,
        },
      })
    );
  }
};
