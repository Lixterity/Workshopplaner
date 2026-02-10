<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from '../stores/dbStore';

const $q = useQuasar();
const email = ref('');
const loading = ref(false);

async function sendReset() {
  loading.value = true;
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/anmelden`,
  });
  loading.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: `Fehler: ${error.message}` });
    return;
  }

  $q.notify({
    type: 'positive',
    message: 'Falls die E-Mail existiert, wurde ein Link zum Zurücksetzen versendet.',
  });
}
</script>

<template>
  <q-page class="page-shell flex flex-center">
    <q-card class="glass-card auth-card q-pa-xl">
      <div class="text-h5 text-weight-bold">Passwort zurücksetzen</div>
      <div class="page-subtitle">Wir senden dir einen Link an deine E-Mail-Adresse.</div>

      <q-form class="q-gutter-md q-mt-lg" @submit.prevent="sendReset">
        <q-input v-model="email" type="email" outlined dense label="E-Mail" />

        <div class="row items-center justify-between">
          <router-link to="/anmelden" class="text-primary text-caption">Zurück zum Login</router-link>
        </div>

        <q-btn type="submit" color="primary" :loading="loading" label="Link senden" no-caps unelevated class="full-width" />
      </q-form>
    </q-card>
  </q-page>
</template>

<style scoped>
.auth-card {
  width: min(460px, 95vw);
}
</style>
