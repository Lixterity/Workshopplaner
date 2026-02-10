import { createApp } from 'vue';
import { Dark, Dialog, Loading, Notify, Quasar } from 'quasar';

import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';
import quasarIconSet from 'quasar/icon-set/material-icons';

import 'quasar/src/css/index.sass';
import './assets/app.css';

import App from './App.vue';
import router from './router';
import { pinia } from './stores/pinia';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(Quasar, {
  iconSet: quasarIconSet,
  plugins: { Dark, Notify, Dialog, Loading },
  config: {
    dark: false,
    notify: {
      position: 'bottom-right',
      timeout: 3200,
      progress: true,
      actions: [{ icon: 'close', color: 'white' }],
    },
  },
});

app.mount('#app');
