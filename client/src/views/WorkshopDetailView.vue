<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const props = defineProps({
  workshopId: {
    type: [String, Number],
    required: true,
  },
});

const dbStore = useDbStore();
const $q = useQuasar();

const qrDialog = ref(false);
const editDialog = ref(false);
const saveLoading = ref(false);

const workshop = computed(() => dbStore.getWorkshopById(Number(props.workshopId)));
const event = computed(() => dbStore.getEventById(workshop.value?.event_id));
const anmeldungen = computed(() => dbStore.getWorkshopAnmeldungen(Number(props.workshopId)));

const editForm = ref({
  titel: '',
  beschreibung: '',
  kapazitaet: 0,
  raum: '',
  adresse: '',
  kosten: 0,
  anfang_datum_zeit: '',
  ende_datum_zeit: '',
  public: true,
  event_id: null,
});

const istRegistriert = computed(() => dbStore.isRegisteredForWorkshop(Number(props.workshopId)));
const belegung = computed(() => dbStore.workshopBelegung(Number(props.workshopId)));
const freiePlaetze = computed(() => {
  if (!workshop.value?.kapazitaet && workshop.value?.kapazitaet !== 0) return null;
  return workshop.value.kapazitaet - belegung.value;
});

const darfBearbeiten = computed(() => {
  if (!workshop.value) return false;
  return dbStore.canEditWorkshop(workshop.value);
});

const qrImageUrl = computed(() => dbStore.qrCodeUrl(`/workshops/${props.workshopId}`));

function formatDate(dateValue) {
  if (!dateValue) return 'Nicht gesetzt';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Nicht gesetzt';

  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function openEdit() {
  if (!workshop.value) return;
  editForm.value = {
    titel: workshop.value.titel,
    beschreibung: workshop.value.beschreibung,
    kapazitaet: workshop.value.kapazitaet,
    raum: workshop.value.raum,
    adresse: workshop.value.adresse,
    kosten: workshop.value.kosten,
    anfang_datum_zeit: workshop.value.anfang_datum_zeit,
    ende_datum_zeit: workshop.value.ende_datum_zeit,
    public: workshop.value.public,
    event_id: workshop.value.event_id,
  };
  editDialog.value = true;
}

async function saveEdit() {
  if (!workshop.value) return;
  saveLoading.value = true;
  const { error } = await dbStore.updateWorkshop(workshop.value.id, editForm.value);
  saveLoading.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: `Speichern fehlgeschlagen: ${error.message}` });
    return;
  }

  editDialog.value = false;
  $q.notify({ type: 'positive', message: 'Workshop aktualisiert.' });
}

async function toggleAnmeldung() {
  if (!workshop.value) return;

  const result = istRegistriert.value
    ? await dbStore.workshopAbmelden(workshop.value.id)
    : await dbStore.workshopAnmelden(workshop.value.id);

  if (result.error) {
    $q.notify({ type: 'negative', message: result.error.message });
    return;
  }

  $q.notify({ type: 'positive', message: istRegistriert.value ? 'Abmeldung erfolgreich.' : 'Anmeldung erfolgreich.' });
}

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max" v-if="workshop">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <div class="text-caption text-primary text-weight-bold">{{ event?.name || 'Event' }}</div>
          <h1 class="page-title">{{ workshop.titel }}</h1>
          <p class="page-subtitle">{{ workshop.beschreibung || 'Keine Beschreibung vorhanden.' }}</p>
        </div>
        <div class="col-12 col-md-auto row q-gutter-sm items-center">
          <q-btn color="primary" icon="qr_code_2" label="Workshop QR" no-caps unelevated @click="qrDialog = true" />
          <q-btn v-if="darfBearbeiten" color="primary" icon="edit" label="Bearbeiten" no-caps unelevated @click="openEdit" />
        </div>
      </div>

      <div class="detail-grid">
        <q-card class="glass-card q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Infos</div>
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon name="schedule" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ formatDate(workshop.anfang_datum_zeit) }}</q-item-label>
                <q-item-label caption>Beginn</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="event_busy" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ formatDate(workshop.ende_datum_zeit) }}</q-item-label>
                <q-item-label caption>Ende</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="meeting_room" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ workshop.raum || 'Raum offen' }}</q-item-label>
                <q-item-label caption>{{ workshop.adresse || 'Adresse offen' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="payments" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ workshop.kosten ?? 0 }} EUR</q-item-label>
                <q-item-label caption>Kosten</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-bold">Anmeldungen</div>
            <q-chip dense outline color="primary">{{ belegung }} / {{ workshop.kapazitaet ?? '-' }}</q-chip>
          </div>
          <q-banner v-if="freiePlaetze !== null" class="q-mb-md" :class="freiePlaetze > 0 ? 'state-box status-ok' : 'state-box status-full'">
            {{ freiePlaetze > 0 ? `${freiePlaetze} freie Plätze` : 'Keine freien Plätze mehr' }}
          </q-banner>

          <q-btn
            :color="istRegistriert ? 'negative' : 'primary'"
            :icon="istRegistriert ? 'event_busy' : 'event_available'"
            :label="istRegistriert ? 'Abmelden' : 'Anmelden'"
            no-caps
            unelevated
            class="full-width q-mb-md"
            @click="toggleAnmeldung"
          />

          <q-separator class="q-my-sm" />

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Teilnehmer</div>
          <q-list dense bordered class="rounded-borders" v-if="anmeldungen.length">
            <q-item v-for="person in anmeldungen" :key="person.id">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">{{ (person.vorname || '?')[0] }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ person.vorname }} {{ person.nachname }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="state-box">Noch keine Anmeldungen.</q-banner>
        </q-card>
      </div>
    </div>

    <div v-else class="content-max">
      <q-banner class="glass-card q-pa-md">Workshop nicht gefunden.</q-banner>
    </div>

    <q-dialog v-model="qrDialog">
      <q-card class="glass-card" style="width: min(360px, 90vw)">
        <q-card-section>
          <div class="text-h6">Workshop QR</div>
        </q-card-section>
        <q-card-section class="text-center">
          <img :src="qrImageUrl" alt="Workshop QR" class="qr-image" />
          <div class="text-caption q-mt-sm">Scan führt direkt zur Workshopseite.</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="editDialog">
      <q-card class="glass-card" style="width: min(760px, 95vw)">
        <q-card-section><div class="text-h6">Workshop bearbeiten</div></q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="editForm.titel" outlined dense label="Titel" />
          <q-input v-model="editForm.beschreibung" type="textarea" autogrow outlined dense label="Beschreibung" />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model.number="editForm.kapazitaet" type="number" outlined dense label="Kapazität" /></div>
            <div class="col-12 col-md-6"><q-input v-model.number="editForm.kosten" type="number" outlined dense label="Kosten" /></div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model="editForm.raum" outlined dense label="Raum" /></div>
            <div class="col-12 col-md-6"><q-input v-model="editForm.adresse" outlined dense label="Adresse" /></div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model="editForm.anfang_datum_zeit" type="datetime-local" outlined dense label="Beginn" /></div>
            <div class="col-12 col-md-6"><q-input v-model="editForm.ende_datum_zeit" type="datetime-local" outlined dense label="Ende" /></div>
          </div>

          <q-toggle v-model="editForm.public" label="Öffentlich" color="primary" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Abbrechen" v-close-popup />
          <q-btn color="primary" :loading="saveLoading" label="Speichern" no-caps unelevated @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.detail-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.1fr 1fr;
}

.qr-image {
  width: 220px;
  height: 220px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.status-ok {
  border-color: rgba(64, 186, 111, 0.45);
  color: #1f7d45;
}

.status-full {
  border-color: rgba(235, 87, 87, 0.45);
  color: #c84545;
}

body.body--dark .status-ok {
  color: #78df9f;
}

body.body--dark .status-full {
  color: #ff9a9a;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

