<script setup>
import { computed, ref } from 'vue';
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
    $q.notify({ type: 'negative', message: result.error.message, multiLine: true, classes: 'notify-compact' });
    return;
  }

  $q.notify({ type: 'positive', message: istRegistriert.value ? 'Abmeldung erfolgreich.' : 'Anmeldung erfolgreich.' });
}

</script>

<template>
  <q-page class="page-shell">
    <div class="content-max" v-if="workshop">
      <div class="q-mb-md">
        <div class="text-caption text-primary text-weight-bold">{{ event?.name || 'Event' }}</div>
        <h1 class="page-title">{{ workshop.titel }}</h1>
      </div>

      <div class="detail-grid">
        <div class="detail-left">
          <q-card class="glass-card q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Beschreibung</div>
            <p class="workshop-beschreibung">{{ workshop.beschreibung || 'Keine Beschreibung vorhanden.' }}</p>
          </q-card>

          <q-card class="glass-card q-pa-md details-card">
            <div class="text-subtitle1 text-weight-bold q-mb-md">Details</div>
            <div class="info-tiles">
              <div class="info-tile">
                <div class="info-tile__icon"><q-icon name="schedule" size="22px" color="primary" /></div>
                <div class="info-tile__content">
                  <div class="info-tile__label">Beginn</div>
                  <div class="info-tile__value">{{ formatDate(workshop.anfang_datum_zeit) }}</div>
                </div>
              </div>
              <div class="info-tile">
                <div class="info-tile__icon"><q-icon name="event_busy" size="22px" color="primary" /></div>
                <div class="info-tile__content">
                  <div class="info-tile__label">Ende</div>
                  <div class="info-tile__value">{{ formatDate(workshop.ende_datum_zeit) }}</div>
                </div>
              </div>
              <div class="info-tile">
                <div class="info-tile__icon"><q-icon name="meeting_room" size="22px" color="primary" /></div>
                <div class="info-tile__content">
                  <div class="info-tile__label">Raum</div>
                  <div class="info-tile__value">{{ workshop.raum || 'Raum offen' }}</div>
                  <div class="info-tile__sub">{{ workshop.adresse || 'Adresse offen' }}</div>
                </div>
              </div>
              <div class="info-tile">
                <div class="info-tile__icon"><q-icon name="payments" size="22px" color="primary" /></div>
                <div class="info-tile__content">
                  <div class="info-tile__label">Kosten</div>
                  <div class="info-tile__value">{{ workshop.kosten ?? 0 }} EUR</div>
                </div>
              </div>
            </div>
          </q-card>

          <q-card class="glass-card q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Aktionen</div>
            <div class="action-buttons">
              <q-btn color="primary" icon="qr_code_2" label="Workshop QR" no-caps unelevated class="col" @click="qrDialog = true" />
              <q-btn v-if="darfBearbeiten" color="primary" icon="edit" label="Bearbeiten" no-caps unelevated class="col" @click="openEdit" />
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              <q-icon name="visibility" size="14px" class="q-mr-xs" />
              {{ workshop.public ? 'Öffentlicher Workshop' : 'Privater Workshop' }}
            </div>
          </q-card>
        </div>

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

          <div class="friend-avatars q-my-sm" v-if="dbStore.friendsInWorkshop(Number(props.workshopId)).length">
            <span class="text-caption text-weight-bold q-mr-sm">Freunde dabei:</span>
            <q-avatar
              v-for="friend in dbStore.friendsInWorkshop(Number(props.workshopId)).slice(0, 5)"
              :key="friend.id"
              size="28px"
              color="primary"
              text-color="white"
              class="friend-avatar"
            >
              {{ (friend.vorname || '?')[0] }}
              <q-tooltip :offset="[0, 4]">{{ `${friend.vorname || ''} ${friend.nachname || ''}`.trim() || friend.email }}</q-tooltip>
            </q-avatar>
            <q-avatar
              v-if="dbStore.friendsInWorkshop(Number(props.workshopId)).length > 5"
              size="28px"
              color="grey-6"
              text-color="white"
              class="friend-avatar"
            >
              +{{ dbStore.friendsInWorkshop(Number(props.workshopId)).length - 5 }}
              <q-tooltip :offset="[0, 4]">{{ dbStore.friendsInWorkshop(Number(props.workshopId)).slice(5).map(f => `${f.vorname || ''} ${f.nachname || ''}`.trim()).join(', ') }}</q-tooltip>
            </q-avatar>
          </div>

          <q-separator class="q-my-sm" />

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Teilnehmer</div>
          <q-list dense bordered class="rounded-borders teilnehmer-liste" v-if="anmeldungen.length">
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
          <div class="text-caption text-grey-7 q-mt-sm">Teile diesen QR-Code, um Freunde einzuladen.</div>
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
  align-items: stretch;
}

.detail-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-left .details-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-left .details-card .info-tiles {
  flex: 1;
}

.workshop-beschreibung {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--wp-text-muted-light);
}

body.body--dark .workshop-beschreibung {
  color: var(--wp-text-muted-dark);
}

.info-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

.info-tile {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--wp-soft-surface-light);
  border: 1px solid rgba(120, 95, 70, 0.1);
}

body.body--dark .info-tile {
  background: var(--wp-soft-surface-dark);
  border-color: rgba(255, 190, 125, 0.12);
}

.info-tile__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.info-tile__label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--wp-text-muted-light);
  margin-bottom: 2px;
}

body.body--dark .info-tile__label {
  color: var(--wp-text-muted-dark);
}

.info-tile__value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
}

.info-tile__sub {
  font-size: 0.78rem;
  color: var(--wp-text-muted-light);
  margin-top: 1px;
}

body.body--dark .info-tile__sub {
  color: var(--wp-text-muted-dark);
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.qr-image {
  width: 220px;
  height: 220px;
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

.friend-avatars {
  display: flex;
  align-items: center;
}

.friend-avatar {
  margin-left: -6px;
  outline: 2px solid white;
  cursor: pointer;
}

.friend-avatar:first-child {
  margin-left: 0;
}

.teilnehmer-liste {
  max-height: 320px;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .info-tiles {
    grid-template-columns: 1fr;
  }
}
</style>

