import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import preact from '@preact/preset-vite'
import { visualizer } from "rollup-plugin-visualizer";


const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

export default defineConfig({
  base: './',
  optimizeDeps: {
    // Only scan the app entry for deps. Without this Vite defaults to globbing
    // "**/*.html", which includes self-contained files in public/ (e.g.
    // building.html) that rely on browser import maps + CDN bare imports and
    // would otherwise fail to resolve (three, three/addons/...).
    entries: ['index.html'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cesium: ['cesium']
        },
      },
    }
  },
  plugins: [
    preact(),
    visualizer(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  },

})
