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

module.exports = { WS_EVENTS, MIME_TYPES };
