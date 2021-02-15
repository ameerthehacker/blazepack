const { terser } = require('rollup-plugin-terser');

module.exports = {
  input: 'src/client/index.js',
  output: [
    {
      file: 'src/static/client.js',
      format: 'umd',
      plugins: [terser()]
    }
  ],
}