import { Manager } from './sandpack';
import { name } from '../../package.json';
import { WS_EVENTS } from '../constants';

let sandpackManager = new Manager('#root', { showOpenInCodeSandbox: false });
const info = (message) => console.log(`${name}: ${message}`)
const ws = new WebSocket(`ws://${window.location.host}`);
let sandboxFiles;

ws.onopen = () => info('connected');

ws.onmessage = (evt) => {
  const { type, data } = JSON.parse(evt.data);
  
  switch (type) {
    case WS_EVENTS.INIT: {
      sandboxFiles = data;

      sandpackManager.updatePreview({
        files: data,
        showOpenInCodeSandbox: false
      });

      break;
    }
    case WS_EVENTS.PATCH: {
      const { event, fileContent, path } = data;

      // do a full page reload on new file or folder creation or deletion
      if (event === 'add' || event === 'unlink') {
        window.location.reload();
      }

      const updatedFiles = { ...sandboxFiles, [path]: { code: fileContent } };

      sandpackManager.updatePreview({ files: updatedFiles, showOpenInCodeSandbox: false });
      break;
    }
  }
}
