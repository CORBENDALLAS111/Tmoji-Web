import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ESM build
  {
    input: 'src/tmoji.ts',
    output: {
      file: 'dist/tmoji.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser()
    ],
    external: ['lottie-web']
  },
  // UMD build
  {
    input: 'src/tmoji.ts',
    output: {
      file: 'dist/tmoji.js',
      format: 'umd',
      name: 'TMoji',
      sourcemap: true,
      globals: {
        'lottie-web': 'lottie'
      }
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser()
    ],
    external: ['lottie-web']
  },
  // Minified UMD
  {
    input: 'src/tmoji.ts',
    output: {
      file: 'dist/tmoji.min.js',
      format: 'umd',
      name: 'TMoji',
      sourcemap: true,
      globals: {
        'lottie-web': 'lottie'
      }
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ],
    external: ['lottie-web']
  }
];
