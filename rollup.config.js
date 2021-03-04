import path from 'path';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const input = path.join('src', 'client', 'index.js');
const output = path.join('src', 'lib', 'index.js');

export default {
  input,
  output: {
    file: output,
    format: 'umd',
    name: 'client',
  },
  plugins: [json(), commonjs(), terser()],
};
