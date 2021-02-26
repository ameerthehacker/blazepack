const WS_EVENTS = {
  PATCH: 'PATCH',
  INIT: 'INIT',
  ERROR: 'ERROR',
  UNHANDLED_SANDPACK_ERROR: 'UNHANDLED_SANDPACK_ERROR'
}

const MIME_TYPES = {
  aac: "audio/aac",
  mid: "audio/midi",
  midi: "audio/x-midi",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wac: "audio/wav",
  wav: "audio/wav",

  mpeg: "video/mpeg",
  avi: "video/x-msvideo",
  webm: "video/webm",
  ogg:"video/ogg",
  mov: "video/quicktime",

  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",

  ico: "image/vnd.microsoft.icon",

  jsonld: "application/ld+json",
  json: "application/json",
  geojson: "application/geo+json",

  csv: "text/csv",

  zip: "application/zip",

  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",

  gltf: "model/gltf+json",
  glb: "model/gltf-binary",

  md: "text/markdown",
};

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

module.exports = { WS_EVENTS, MIME_TYPES, TEMPLATES };
