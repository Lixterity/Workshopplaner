<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const email = ref('')
const sending = ref(false)
const form = ref(null)

function validateEmail(value) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
  return re.test(value)
}

const emailRules = [
  v => !!v || 'E-Mail ist erforderlich',
  v => validateEmail(v) || 'Bitte gib eine gültige E-Mail-Adresse ein.'
]

async function submit() {
  if (form.value && typeof form.value.validate === 'function') {
    const ok = form.value.validate()
    if (!ok) {
      $q.notify({ type: 'negative', message: 'Bitte überprüfe die E-Mail-Adresse.' })
      return
    }
  } else {
    if (!email.value || !validateEmail(email.value)) {
      $q.notify({ type: 'negative', message: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
      return
    }
  }

  sending.value = true

  setTimeout(() => {
    sending.value = false
    email.value = ''
    if (form.value && typeof form.value.reset === 'function') {
      form.value.reset()
    }
    $q.notify({
      type: 'positive',
      message:
        'Wenn die E-Mail-Adresse in unserem System existiert, erhältst du in Kürze eine Nachricht mit weiteren Anweisungen.'
    })
  }, 900)
}
</script>

<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'auth-shell--dark' : 'auth-shell--light'">
    <q-card class="auth-card column" :class="$q.dark.isActive ? 'auth-card--dark text-white' : 'auth-card--light'">
      <div class="column items-center text-center q-gutter-xs q-mb-xl">
        <q-icon name="lock_reset" size="40px" color="primary" />
        <div class="text-h5 text-weight-bold">Passwort zurücksetzen</div>
        <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Trage deine E-Mail-Adresse ein, wir senden dir weitere Anweisungen.
        </div>
      </div>

      <q-form ref="form" class="column q-gutter-md" @submit.prevent="submit">
        <q-input v-model="email" :rules="emailRules" lazy-rules label="E-Mail" type="email" outlined dense />

        <div class="row justify-end q-mt-xs q-mb-sm">
          <router-link to="/login" class="text-caption text-primary text-weight-medium">Zurück zur Anmeldung</router-link>
        </div>

        <q-btn
          color="primary"
          :label="sending ? 'Sende...' : 'Anfrage senden'"
          :loading="sending"
          @click.prevent="submit"
          unelevated
          size="lg"
          class="q-mt-sm"
          no-caps
        />
      </q-form>
    </q-card>
  </q-page>
</template>

<style scoped>
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
