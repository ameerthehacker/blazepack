var execSync = require('child_process').execSync;
var open = require('open');

function openBrowser(url) {
  const shouldTryOpenChromiumWithAppleScript = process.platform === 'darwin';

  if (shouldTryOpenChromiumWithAppleScript) {
    // Will use the first open browser found from list
    const supportedChromiumBrowsers = [
      'Google Chrome Canary',
      'Google Chrome',
      'Microsoft Edge',
      'Brave Browser',
      'Vivaldi',
      'Chromium',
    ];

    for (let chromiumBrowser of supportedChromiumBrowsers) {
      try {
        // Try our best to reuse existing tab
        // on OSX Chromium-based browser with AppleScript
        execSync('ps cax | grep "' + chromiumBrowser + '"');
        execSync(
          'osascript open-chrome.applescript "' +
            encodeURI(url) +
            '" "' +
            chromiumBrowser +
            '"',
          {
            cwd: __dirname,
            stdio: 'ignore',
          }
        );
        return true;
      } catch (err) {
        // Ignore errors.
      }
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    open(url).catch(() => {}); // Prevent `unhandledRejection` error.
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = openBrowser;
