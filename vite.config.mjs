import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Fonts from 'unplugin-fonts/vite'
// Plugins
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'

// Utilities
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      // `labs: true` also auto-imports lab components (VTimePicker, VDateInput, …).
      // Without it they resolve to nothing and Vue warns "Failed to resolve component".
      autoImport: { labs: true },
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      // `custom.preload` also governs the fontsource families below, and its default
      // is ON — which is why this is here even though no custom family is declared.
      //
      // The preload pass scans the WHOLE Vite bundle for anything matching
      // /\.(woff2?|ttf|eot|otf)$/ and emits `<link rel="preload">` for every hit, not
      // just the faces this plugin manages. With it on, index.html carried 252 preload
      // tags covering 7.3MB of fonts — including all four formats of the Material
      // Design Icons webfont, which the browser would otherwise never fetch more than
      // one of, and every Roboto subset (cyrillic, greek, math, symbols, vietnamese)
      // that Latin-script content never renders a character from. `preload` fetches at
      // high priority, ahead of the JS, so this was several megabytes of blocking
      // download before first paint.
      //
      // Off, the browser resolves fonts from the CSSOM as normal: one format per
      // @font-face `src` list, and only the subsets whose `unicode-range` matches text
      // actually on screen.
      custom: { families: [], preload: false },
      fontsource: {
        families: [
          // Inter is the ONLY font this app renders. custom-theme.css opens with
          // `* { font-family: 'Inter', … !important }`, so Vuetify's default Roboto
          // never wins a single element — it used to be bundled here anyway, roughly
          // 200 files across six weights, two styles and every subset, for text that
          // is never drawn in it. Removing it costs nothing visible.
          //
          // 300 backs the one `font-weight-light` usage; 600 is the `.font-serif`
          // display weight. Italic stays at 400 only — the italic text in this app is
          // all caption-weight ("Not linked", "Unassigned"), never bold.
          {
            name: 'Inter',
            weights: [300, 400, 500, 600, 700],
            styles: ['normal'],
          },
          { name: 'Inter', weights: [400], styles: ['italic'] },
        ],
      },
    }),

  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    host: true,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
