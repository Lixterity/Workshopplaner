<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';
import { getAuthErrorMessage } from '../utils/errorMessages';

const dbStore = useDbStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

async function submitLogin() {
  loading.value = true;
  const { error } = await dbStore.handleLogin(email.value, password.value);
  loading.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: getAuthErrorMessage(error, 'Anmeldung fehlgeschlagen. Bitte prüfe deine Angaben.') });
    return;
  }

  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    await router.push(redirect);
    return;
  }

  await router.push(dbStore.routeNachRolle());
}

async function loginGoogle() {
  const { error } = await dbStore.handleGoogleLogin();
  if (error) {
    $q.notify({ type: 'negative', message: getAuthErrorMessage(error, 'Google Anmeldung fehlgeschlagen. Bitte versuche es erneut.') });
  }
}
</script>

<template>
  <q-page class="page-shell flex flex-center">
    <q-card class="glass-card auth-card q-pa-xl">
      <div class="text-center q-mb-md">
        <div class="text-h5 text-weight-bold">Anmelden</div>
        <div class="page-subtitle">Melde dich mit E-Mail/Passwort oder direkt mit Google an.</div>
      </div>

      <div class="auth-form">
        <q-btn
          class="q-mt-sm full-width"
          color="positive"
          text-color="white"
          icon="fa-brands fa-google"
          label="Mit Google anmelden"
          no-caps
          unelevated
          @click="loginGoogle"
        />

        <div class="row items-center q-my-md">
          <q-separator class="col" />
          <span class="q-px-md text-caption text-grey-6">ODER</span>
          <q-separator class="col" />
        </div>

        <q-form class="auth-form-fields" @submit.prevent="submitLogin">
          <q-input v-model="email" outlined dense type="email" label="E-Mail" autocomplete="email" />

          <q-input
            v-model="password"
            outlined
            dense
            :type="showPassword ? 'text' : 'password'"
            label="Passwort"
            autocomplete="current-password"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div class="row items-center justify-between">
            <router-link to="/passwort-vergessen" class="text-primary text-caption">Passwort vergessen?</router-link>
            <router-link to="/registrieren" class="text-primary text-caption">Noch kein Konto?</router-link>
          </div>

          <q-btn type="submit" color="primary" :loading="loading" label="Anmelden" no-caps unelevated class="full-width" />
        </q-form>
      </div>
    </q-card>
  </q-page>
</template>

<style scoped>
.auth-card {
  width: min(460px, 95vw);
  margin: 0 auto;
}

.auth-form {
  width: min(420px, 100%);
  margin: 0 auto;
}

.auth-form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
