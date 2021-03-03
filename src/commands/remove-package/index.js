const fs = require('fs');
const { logError, logSuccess, getPackageJSON } = require('../../utils');

async function removePackage(packageName) {
  try {
    const potentialJSON = getPackageJSON();

    if (potentialJSON) {
      const { json: packageJSON, indent, file } = potentialJSON;
      if (packageJSON.dependencies) {
        const {
          [packageName]: removedPackage,
          ...deps
        } = packageJSON.dependencies;

        packageJSON.dependencies = deps;
      }

      fs.writeFileSync(file, JSON.stringify(packageJSON, null, indent));

      logSuccess(`Removed package ${packageName}`);
    } else {
      logError('Unable to find package.json for the project');
    }
  } catch (err) {
    logError(`Unable to remove package ${package}: ${err}`);
  }
}

module.exports = removePackage;
