<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const route = useRoute();
const dbStore = useDbStore();
const $q = useQuasar();

const qrDialog = ref(false);
const saving = ref(false);
const form = ref({
  vorname: '',
  nachname: '',
  erforderliche_stunden: 0,
});

const profil = computed(() => {
  if (!route.params.id) {
    return dbStore.profile;
  }

  const rawId = String(route.params.id);
  return (
    dbStore.teilnehmer.find((person) => String(person.id) === rawId) ||
    dbStore.teilnehmer.find((person) => String(person.auth_user_id) === rawId) ||
    null
  );
});

const isOwnProfile = computed(() => {
  if (!profil.value || !dbStore.profile) return false;
  return profil.value.id === dbStore.profile.id;
});

const profilQrUrl = computed(() => {
  if (!profil.value) return '';
  return dbStore.qrCodeUrl(`/profil/${profil.value.id}`);
});

const istFreund = computed(() => {
  if (!profil.value || isOwnProfile.value) return false;
  return dbStore.freunde.some((item) => item.id === profil.value.id);
});

function syncForm() {
  form.value = {
    vorname: profil.value?.vorname || '',
    nachname: profil.value?.nachname || '',
    erforderliche_stunden: profil.value?.erforderliche_stunden || 0,
  };
}

async function saveProfil() {
  if (!isOwnProfile.value) return;

  saving.value = true;
  const { error } = await dbStore.updateProfil(form.value);
  saving.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: `Profil konnte nicht gespeichert werden: ${error.message}` });
    return;
  }

  $q.notify({ type: 'positive', message: 'Profil gespeichert.' });
}

function sendeAnfrage() {
  if (!profil.value) return;
  const authUserId = profil.value.auth_user_id;
  const { error } = dbStore.sendeFreundschaftsanfrage(authUserId);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Freundschaftsanfrage gesendet.' });
}

onMounted(async () => {
  await dbStore.refreshAll();
  syncForm();
});

watch(profil, () => {
  syncForm();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max" v-if="profil">
      <div class="profile-grid">
        <q-card class="glass-card q-pa-lg">
          <div class="row items-start justify-between q-col-gutter-md">
            <div class="col-auto">
              <q-avatar size="88px" color="primary" text-color="white" class="text-h5">
                {{ (profil.vorname || '?')[0] }}{{ (profil.nachname || '?')[0] }}
              </q-avatar>
            </div>
            <div class="col">
              <h1 class="page-title">{{ profil.vorname }} {{ profil.nachname }}</h1>
              <p class="page-subtitle">{{ profil.email }}</p>
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn color="primary" icon="qr_code_2" label="Profil QR" no-caps unelevated @click="qrDialog = true" />
                <q-btn
                  v-if="!isOwnProfile && !istFreund"
                  color="primary"
                  
                  icon="person_add"
                  label="Freund hinzufügen"
                  no-caps
                  unelevated
                  @click="sendeAnfrage"
                />
              </div>
            </div>
          </div>
        </q-card>

        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Profil bearbeiten</div>
          <div v-if="isOwnProfile" class="q-gutter-md">
            <q-input v-model="form.vorname" outlined dense label="Vorname" />
            <q-input v-model="form.nachname" outlined dense label="Nachname" />
            <q-input v-model.number="form.erforderliche_stunden" outlined dense type="number" min="0" label="Erforderliche Stunden" />

            <q-btn color="primary" :loading="saving" label="Speichern" no-caps unelevated @click="saveProfil" />
          </div>
          <div v-else class="text-body2 text-grey-7">Nur das eigene Profil kann bearbeitet werden.</div>
        </q-card>
      </div>
    </div>

    <div v-else class="content-max">
      <q-banner class="glass-card q-pa-md">Profil nicht gefunden.</q-banner>
    </div>

    <q-dialog v-model="qrDialog">
      <q-card class="glass-card" style="width: min(360px, 90vw)">
        <q-card-section>
          <div class="text-h6">Profil QR</div>
        </q-card-section>
        <q-card-section class="text-center">
          <img :src="profilQrUrl" alt="Profil QR" class="qr-image" />
          <div class="text-caption q-mt-sm">Scan führt auf dieses Profil.</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.qr-image {
  width: 220px;
  height: 220px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

@media (max-width: 960px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>

