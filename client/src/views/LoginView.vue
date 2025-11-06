<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const showPassword = ref(false)
const rememberSelection = ref([])
const rememberOptions = [
  { label: 'Angemeldet bleiben', value: 'stay-signed-in' }
]
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
        <q-icon name="event_note" size="40px" color="primary" />
        <div class="text-h5 text-weight-bold">Anmelden</div>
        <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Willkommen zurück im Workshopplaner
        </div>
      </div>

      <q-btn
        color="positive"
        text-color="white"
        icon="fa-brands fa-google"
        label="Mit Google anmelden"
        class="google-btn full-width q-mb-md"
        rounded
        unelevated
        no-caps
      />

      <div class="row items-center q-mb-md divider">
        <div class="col">
          <q-separator />
        </div>
        <div class="col-auto text-caption q-px-md" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">
          ODER
        </div>
        <div class="col">
          <q-separator />
        </div>
      </div>

      <q-form class="column q-gutter-md">
        <q-input label="E-Mail" type="email" outlined dense />
        <q-input label="Passwort" :type="showPassword ? 'text' : 'password'" outlined dense>
          <template #append>
        <q-icon
          :name="showPassword ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
          </template>
        </q-input>

        <div class="row justify-end q-mt-xs q-mb-sm">
          <router-link to="/forgot-password" class="text-caption text-primary text-weight-medium">
            Passwort vergessen?
          </router-link>
        </div>

        <q-option-group
          v-model="rememberSelection"
          type="checkbox"
          dense
          :options="rememberOptions"
          class="text-caption q-mt-xs q-mb-sm"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
        />
        
        <q-btn
          color="primary"
          label="Anmelden"
          unelevated
          size="lg"
          class="q-mt-sm"
          no-caps
        />
      </q-form>

      <div class="text-caption q-mt-lg text-center" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        Noch kein Konto?
        <router-link to="/register" class="text-primary text-weight-medium">
          Konto erstellen
        </router-link>
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
.divider {
  width: 100%;
}
.google-btn {
  border-radius: 999px;
  padding: 10px 0;
  box-shadow: 0 12px 24px rgba(33, 186, 69, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}
.google-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(33, 186, 69, 0.28);
}
.google-btn:active {
  transform: translateY(0);
  opacity: 0.95;
}
</style>
