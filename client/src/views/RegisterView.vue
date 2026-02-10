<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';
import { getAuthErrorMessage } from '../utils/errorMessages';

const dbStore = useDbStore();
const $q = useQuasar();
const router = useRouter();

const vorname = ref('');
const nachname = ref('');
const email = ref('');
const password = ref('');
const passwortBestaetigung = ref('');
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const loading = ref(false);

async function register() {
  if (!vorname.value || !nachname.value || !email.value || !password.value || !passwortBestaetigung.value) {
    $q.notify({ type: 'negative', message: 'Bitte alle Felder ausfüllen.' });
    return;
  }

  if (password.value.length < 8) {
    $q.notify({ type: 'negative', message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
    return;
  }

  if (password.value !== passwortBestaetigung.value) {
    $q.notify({ type: 'negative', message: 'Die Passwörter stimmen nicht überein.' });
    return;
  }

  loading.value = true;
  const fullName = `${vorname.value} ${nachname.value}`.trim();
  const { error } = await dbStore.handleUserRegister(
    email.value,
    password.value,
    fullName,
    dbStore.ROLLEN.TEILNEHMER,
  );
  loading.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: getAuthErrorMessage(error, 'Registrierung fehlgeschlagen. Bitte prüfe deine Angaben.') });
    return;
  }

  await router.push(dbStore.routeNachRolle());
}
</script>

<template>
  <q-page class="page-shell flex flex-center">
    <q-card class="glass-card auth-card q-pa-xl">
      <div class="text-center q-mb-md">
        <div class="text-h5 text-weight-bold">Registrieren</div>
        <div class="page-subtitle">Erstelle ein Konto für den Workshopplaner.</div>
      </div>

      <q-form class="q-mt-lg auth-form auth-form-fields" @submit.prevent="register">
        <div class="name-grid">
          <div>
            <q-input v-model="vorname" outlined dense label="Vorname" />
          </div>
          <div>
            <q-input v-model="nachname" outlined dense label="Nachname" />
          </div>
        </div>

        <q-input v-model="email" type="email" outlined dense label="E-Mail" />

        <q-input v-model="password" outlined dense :type="showPassword ? 'text' : 'password'" label="Passwort">
          <template #append>
            <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
          </template>
        </q-input>

        <q-input
          v-model="passwortBestaetigung"
          outlined
          dense
          :type="showPasswordConfirm ? 'text' : 'password'"
          label="Passwort bestätigen"
        >
          <template #append>
            <q-icon
              :name="showPasswordConfirm ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPasswordConfirm = !showPasswordConfirm"
            />
          </template>
        </q-input>

        <div class="row items-center justify-between">
          <router-link to="/anmelden" class="text-primary text-caption">Schon ein Konto?</router-link>
        </div>

        <q-btn type="submit" color="primary" :loading="loading" label="Konto erstellen" no-caps unelevated class="full-width" />
      </q-form>
    </q-card>
  </q-page>
</template>

<style scoped>
.auth-card {
  width: min(540px, 95vw);
  margin: 0 auto;
}

.auth-form {
  width: min(440px, 100%);
  margin: 0 auto;
}

.auth-form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.name-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 700px) {
  .name-grid {
    grid-template-columns: 1fr;
  }
}
</style>
