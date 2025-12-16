<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useDbStore } from '../stores/dbStore';

const $q = useQuasar();
const dbStore = useDbStore();

const showPassword = ref(false);
const showConfirm = ref(false);
const email = ref('');
const password = ref('');
const confirmedPassword = ref('');
const username = ref('');
</script>

<template>
  <q-page
    class="flex flex-center"
    :class="['auth-shell', $q.dark.isActive ? 'auth-shell--dark' : 'auth-shell--light']"
  >
    <q-card
      class="auth-card column"
      :class="$q.dark.isActive ? 'auth-card--dark text-white' : 'auth-card--light'"
    >
      <div class="column items-center text-center q-gutter-xs q-mb-xl">
        <q-icon name="event_available" size="40px" color="primary" />
        <div class="text-h5 text-weight-bold">Konto erstellen</div>
        <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Starte in wenigen Minuten mit deinem Workshopplaner
        </div>
      </div>

      <q-form class="column q-gutter-md">
        <q-input v-model="username" label="Name" outlined dense />
        <q-input v-model="email" label="E-Mail" type="email" outlined dense />
        <q-input
          v-model="password"
          label="Passwort"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
        <q-input
          label="Passwort bestätigen"
          v-model="confirmedPassword"
          :type="showConfirm ? 'text' : 'password'"
          outlined
          dense
        >
          <template #append>
            <q-icon
              :name="showConfirm ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirm = !showConfirm"
            />
          </template>
        </q-input>
        <q-btn
          color="primary"
          label="Konto erstellen"
          class="q-mt-sm"
          size="lg"
          no-caps
          unelevated
          :disable="confirmedPassword != password"
          @click="dbStore.handleUserRegister(email, password, username)"
        />
      </q-form>

      <div
        class="text-caption q-mt-lg text-center"
        :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
      >
        Schon ein Konto?
        <router-link to="/login" class="text-primary text-weight-medium"> Anmelden </router-link>
      </div>
    </q-card>
  </q-page>
</template>

<style scoped>
.auth-shell {
  width: 100%;
  min-height: calc(100vh - 98px);
  padding: 48px 16px;
  transition: background 0.3s ease;
}
.auth-shell--light {
  background: linear-gradient(145deg, #f5f7fa 0%, #ffffff 100%);
}
.auth-shell--dark {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.15), rgba(11, 20, 33, 0.92));
}
.auth-card {
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  padding: 40px;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.auth-card--light {
  background-color: #ffffff;
  box-shadow: 0 24px 50px rgba(25, 118, 210, 0.12);
}
.auth-card--dark {
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}
</style>
