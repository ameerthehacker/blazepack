const {
  startDevServer,
  waitFor,
  cleanFixtures,
  createApp,
} = require('./utils');
const path = require('path');
const fs = require('fs');
const waitPort = require('wait-port');

const REACT_APP = path.join('e2e', 'fixtures', 'react-app');

describe('Dev Server', () => {
  let devServer;
  let waitUnitDevServerStops;

  beforeAll(async () => {
    await cleanFixtures();
    await createApp(REACT_APP, 'react');

    devServer = startDevServer(REACT_APP);

    waitUnitDevServerStops = () =>
      new Promise((resolve) => {
        devServer.on('exit', resolve);
      });

    await waitPort({
      host: 'localhost',
      protocol: 'http',
      port: 3000,
      timeout: 10000,
      output: 'silent',
    });
    await page.goto('http://localhost:3000');
    // wait until the page is loaded
    await page.waitForSelector('h1');
  });

  it('should update document title', async () => {
    await expect(page.title()).resolves.toMatch('React App');
  });

  it('should run the react app', async () => {
    const headingText = await page.evaluate(() => {
      const heading = document.getElementsByTagName('h1')[0];

      return heading.innerText;
    });

    expect(headingText).toBe('Hello CodeSandbox');
  });

  it('spa routing should works', async () => {
    await page.goto('http://localhost:3000/about');
    // wait until the page is loaded
    await page.waitForSelector('h1');

    const headingText = await page.evaluate(() => {
      const heading = document.getElementsByTagName('h1')[0];

      return heading.innerText;
    });

    expect(headingText).toBe('Hello CodeSandbox');
  });

  it('should update preview when files are updated', async () => {
    const APPJS = path.join(process.cwd(), REACT_APP, 'src', 'App.js');
    const newContent = `
    import "./styles.css";

    export default function App() {
      return (
        <div className="App">
          <h1>Hello CodeSandbox Edited!</h1>
          <h2>Start editing to see some magic happen!</h2>
        </div>
      );
    }
    `;

    fs.writeFileSync(APPJS, newContent);
    await waitFor(3000);

    const headingText = await page.evaluate(() => {
      const heading = document.getElementsByTagName('h1')[0];

      return heading.innerText;
    });

    expect(headingText).toBe('Hello CodeSandbox Edited!');
  });

  afterAll(async () => {
    devServer.kill();

    await waitUnitDevServerStops();
  });
});
