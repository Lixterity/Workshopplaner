<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDbStore } from '../stores/dbStore';
import { getAuthErrorMessage } from '../utils/errorMessages';

const $q = useQuasar();
const dbStore = useDbStore();
const router = useRouter();

onMounted(async () => {
  $q.loading.show({ message: 'Anmeldung wird abgeschlossen...' });
  const { error } = await dbStore.completeOAuthLogin();
  $q.loading.hide();
  if (error) {
    $q.notify({ type: 'negative', message: getAuthErrorMessage(error, 'Google Anmeldung fehlgeschlagen. Bitte versuche es erneut.') });
    await router.replace('/anmelden');
    return;
  }

  await router.replace(dbStore.routeNachRolle());
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <q-card class="glass-card q-pa-xl text-center">
        <q-spinner-bars color="primary" size="56px" />
        <div class="text-h6 q-mt-md">Bitte warten...</div>
        <div class="page-subtitle">Wir verbinden dein Konto mit dem Workshopplaner.</div>
      </q-card>
    </div>
  </q-page>
</template>
