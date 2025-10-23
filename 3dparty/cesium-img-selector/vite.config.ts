import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";

const extensions = {
  'es': 'mjs',
  'cjs': 'cjs',
  'iife': 'js'
};
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      name: `ImgSelectorModule`,
      entry: resolve(__dirname, 'src/ImgSelector.ts'),
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => `img-selector.${extensions[format as keyof typeof extensions]}`,
    },
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  },
  define: {
    'process.env': {
      "NODE_ENV": "production"
    },
    'production': JSON.stringify({}),
  },
  plugins: [
    preact(),
    dts({
      insertTypesEntry: true,
    })
  ],
})
