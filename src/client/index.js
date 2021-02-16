import { Manager } from './sandpack';
import { name } from '../../package.json';

let sandpackManager = new Manager('#root', { showOpenInCodeSandbox: false });
const info = (message) => console.log(`${name}: ${message}`)
const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => info('connected');

ws.onmessage = (evt) => {
  sandpackManager.updatePreview({
    files: JSON.parse(evt.data)
  })
}
