// Author-only conversion; consumers open index.html without Node or npm.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const here = dirname(fileURLToPath(import.meta.url));
const authorRoot = process.env.C05_AUTHOR_ROOT ? resolve(process.env.C05_AUTHOR_ROOT) : here;
const require = createRequire(join(authorRoot, 'package.json'));
const esbuild = require('esbuild'), postcss = require('postcss'), tailwind = require('@tailwindcss/postcss');
await mkdir(join(here, 'assets'), { recursive: true });
const result = await esbuild.build({ absWorkingDir: here, entryPoints: ['app/main.tsx'],
  outfile: join(here, 'assets/app.js'), bundle: true, format: 'iife', platform: 'browser',
  target: 'es2022', jsx: 'automatic', minify: true, legalComments: 'inline', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'declared-react-author-dependencies', setup(build) {
    build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, args => ({ path: require.resolve(args.path) }));
  } }],
});
let css = await readFile(join(here, 'app/globals.css'), 'utf8');
css = css.replace("@import 'tailwindcss';", '@import ' + JSON.stringify(require.resolve('tailwindcss/index.css')) + ';');
const output = await postcss([tailwind({ base: here, optimize: true })]).process(css,
  { from: join(here, 'app/globals.css'), to: join(here, 'assets/styles.css'), map: false });
await writeFile(join(here, 'assets/styles.css'), output.css);
console.log(JSON.stringify({ producer: 'A author-only esbuild/PostCSS', source: 'app/main.tsx',
  output: ['index.html', 'assets/app.js', 'assets/styles.css'],
  bundled_modules: Object.keys(result.metafile.inputs), css_bytes: Buffer.byteLength(output.css),
  consumer: 'ordinary local HTML/static HTTP, no npm or Next runtime' }));
