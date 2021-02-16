const parseArgs = require('minimist');
const http = require('http');
const fs = require('fs');
const path = require('path');
const getAllFiles = require('get-all-files').default;

const EXCLUDED_DIRECTORIES = [
  /node_modules/,
  /.git/,
  /.cache/
];
const EXCLUDED_FILES = [
  /yarn.lock/,
  /package-lock.json/,
  /.gitignore/
]
const args = parseArgs(process.argv.slice(2));
const DEFAULT_PORT = 3000;
const PORT = args.port || DEFAULT_PORT;
const STATIC_PATH = path.join(__dirname, 'static');
const INDEX_HTML_PATH = path.join(STATIC_PATH, 'index.html');
const assetExistsInStaticPath = (url) => {
  const assetPath = path.join(STATIC_PATH, url);

  return fs.existsSync(assetPath);
}
const sendIndexHTML = (res) => {
  const indexHTMLContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

  res.write(indexHTMLContent);
  res.end();
}
const directory = args._[0] || process.cwd();
// get all files in the dir except node modules
const filePaths = getAllFiles.sync.array(directory, {
  resolve: true,
  isExcludedDir: (dirname) => EXCLUDED_DIRECTORIES.find(excludedDir => excludedDir.test(dirname))
});
let sandboxFiles = {};

filePaths.forEach(filePath => {
  // we don't want to read unneccessary huge files
  const isExcludedFile = EXCLUDED_FILES.find(excludedFile => excludedFile.test(filePath));

  if (isExcludedFile) return;

  const relativePath = path.relative(directory, filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  sandboxFiles[`/${relativePath}`] = {
    code: fileContent
  };

  return sandboxFiles;
});

console.log(sandboxFiles);

http.createServer((req, res) => {
  if (req.url === '/') {
    sendIndexHTML(res);
  } else {
    if (assetExistsInStaticPath(req.url)) {
      const assetPath = path.join(STATIC_PATH, req.url);
      const assetContent = fs.readFileSync(assetPath, 'utf-8');

      res.write(assetContent);
      res.end();
    } else {
      sendIndexHTML(res);
    }
  }
}).listen(PORT, () => {
  console.log(`🔥 Blazepack dev server running at http://localhost:${PORT}`);
});
