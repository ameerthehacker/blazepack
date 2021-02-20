import { WS_EVENTS } from '../constants';
import { name } from '../../package.json';

const compile = window.compile;
const getSandboxTemplate = window.getTemplate;
const info = (message) => console.log(`${name}: ${message}`)
const ws = new WebSocket(`ws://${window.location.host}`);
let sandboxFiles;

ws.onopen = () => info('connected');

function getFilename(filePath) {
  const fileParts = filePath.split('/');
  const filename = fileParts[fileParts.length - 1];

  return filename;
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

        compile({
          modules: sandboxFiles,
          codesandbox: true,
          externalResources: [],
          template: getSandboxTemplateName(sandboxFiles),
          isInitializationCompile: true 
        });

        break;
      }
      case WS_EVENTS.PATCH: {
        const { event, fileContent, path } = data;
        const filename = getFilename(path);

        // we need to reload so that sandpack can install the package
        if (filename === "package.json") {
          window.location.reload();
        }

        // do a full page reload on new file or folder creation or deletion
        if (event === "add" || event === "unlink") {
          window.location.reload();
        }

        const updatedFiles = { ...sandboxFiles, [path]: { code: fileContent, path } };

        compile({
          modules: updatedFiles,
          codesandbox: true,
          externalResources: [],
          template: getSandboxTemplateName(updatedFiles)
        });
        
        break;
      }
    }
  } catch(e) {
     ws.send(
       JSON.stringify({
         type: WS_EVENTS.UNHANDLED_SANDPACK_ERROR,
         data: {
           title: "Unhandled Sandpack error while running the app.",
           message: e.message,
         },
       })
     );
  }
}