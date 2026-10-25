import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({optimizeDeps:{entries:['index.html']},build:{rollupOptions:{input:{game:fileURLToPath(new URL('./index.html',import.meta.url)),editor:fileURLToPath(new URL('./map-editor.html',import.meta.url))}}}});
