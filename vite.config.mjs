import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => ({
  root: fileURLToPath(new URL('./preview', import.meta.url)),
  publicDir: command === 'serve' ? fileURLToPath(new URL('./public', import.meta.url)) : false,
  plugins: [{
    name: 'woframe-example',
    apply: 'build',
    async generateBundle() {
      const {readFile} = await import('node:fs/promises');
      this.emitFile({type: 'asset', fileName: 'examples/episode.json',
        source: await readFile(new URL('./public/examples/episode.json', import.meta.url))});
    },
  }],
}));
