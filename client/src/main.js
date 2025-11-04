import { createApp } from 'vue'
import { Quasar, Dark } from 'quasar'

import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import quasarIconSet from 'quasar/icon-set/material-icons'

import 'quasar/src/css/index.sass'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  iconSet: quasarIconSet,
  plugins: { Dark },
  config: { dark: false }
})

app.mount('#app')
