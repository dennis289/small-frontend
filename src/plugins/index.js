/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

import { createPinia } from 'pinia'
import router from '../router'
import vuetify from './vuetify'

export function registerPlugins (app) {
  app
    .use(createPinia())
    .use(vuetify)
    .use(router)
}
