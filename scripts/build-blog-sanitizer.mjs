import { build } from 'esbuild';
import { builtinModules } from 'node:module';

// Vercel's require hook cannot load sanitize-html's ESM-only htmlparser2.
// Bundle the maintained sanitizer and parser together into CommonJS at build
// time, so runtime require() calls are limited to Node's own built-in modules.
const result = await build({
  stdin: { contents: "module.exports = require('sanitize-html');", resolveDir: process.cwd(), sourcefile: 'blog-sanitizer-entry.cjs' },
  bundle: true, platform: 'node', target: 'node22', format: 'cjs',
  outfile: 'dist-server/blog-sanitizer.cjs', metafile: true,
});
const builtins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
for (const output of Object.values(result.metafile.outputs)) {
  for (const dependency of output.imports) {
    if (dependency.external && !builtins.has(dependency.path)) throw new Error(`Unbundled sanitizer dependency: ${dependency.path}`);
  }
}
console.log('Blog sanitizer and parser bundled for the server runtime.');
