const findPackageJSON = require('find-package-json');
const detectIndent = require('detect-indent');
const getLatestPackageVersion = require('latest-version');
const fs = require('fs');
const { logError, logSuccess } = require('../../utils');

async function installPackage(package) {
  try {
    const [packageName, version] = package.split('@');
    const iterator = findPackageJSON();
    const nextPackageJSON = iterator.next();

    if (nextPackageJSON && nextPackageJSON.filename) {
      const packageJSONContent = fs.readFileSync(nextPackageJSON.filename, 'utf-8');
      const packageJSON = JSON.parse(packageJSONContent);
      const latestVersion = await getLatestPackageVersion(packageName);
      const packageVersion = version || latestVersion;
  
      if (packageJSON.dependencies) {
        packageJSON.dependencies = {
          ...packageJSON.dependencies,
          [packageName]: `^${packageVersion}`
        }
      }
  
      // detectIntent keeps up the indentation of the original file preserved 
      fs.writeFileSync(nextPackageJSON.filename, JSON.stringify(packageJSON, null, detectIndent(packageJSONContent).indent || 2));

      logSuccess(`Installed package ${packageName}@${packageVersion}`);
    } else {
      logError('Unable to find package.json for the project');
    }
  } catch(err) {
    if (err.name === 'PackageNotFoundError')  {
      logError(`Unable to find package ${package} in the npm registry`);
    } else {
      logError(`Unable to install package ${package}: ${err}`);
    }
  }
}

module.exports = installPackage;
