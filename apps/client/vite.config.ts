import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const LEGACY_DIR = fileURLToPath(new URL('./src/legacy/', import.meta.url));

/**
 * The prototype's UI/rendering code was ported as numbered shared-scope JS scripts in src/legacy/
 * (they still call each other's functions directly, as in the single-file prototype). This plugin
 * concatenates them in order into one module, `virtual:legacy`.
 */
function legacyScripts(): Plugin {
  const id = '\0virtual:legacy';
  return {
    name: 'chakachak-legacy',
    resolveId: (s) => (s === 'virtual:legacy' ? id : null),
    async load(s) {
      if (s !== id) return null;
      const files = readdirSync(LEGACY_DIR)
        .filter((f) => /^\d\d-.*\.js$/.test(f))
        .sort();
      for (const f of files) this.addWatchFile(LEGACY_DIR + f);
      const src = files
        .map((f) => `// ---- ${f}\n` + readFileSync(LEGACY_DIR + f, 'utf8'))
        .join('\n');
      return src + '\nexport {};\n';
    },
  };
}

export default defineConfig({
  plugins: [legacyScripts()],
  build: { target: 'es2022' },
});
