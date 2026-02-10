<script setup>
import { computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const meineRegistriertenWorkshops = computed(() => dbStore.meineWorkshops);

const meineOrganisatorWorkshops = computed(() => {
  if (!dbStore.istOrganisator && !dbStore.istAdmin) return [];
  return dbStore.workshops.filter((item) => dbStore.canEditWorkshop(item));
});

function eventName(eventId) {
  return dbStore.getEventById(eventId)?.name || `Event #${eventId}`;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Datum offen';
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function abmelden(workshopId) {
  const { error } = await dbStore.workshopAbmelden(workshopId);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Abmeldung erfolgreich.' });
}

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="q-mb-md">
        <h1 class="page-title">Meine Workshops</h1>
        <p class="page-subtitle">Hier siehst du deine Anmeldungen und deine eigenen Workshops.</p>
      </div>

      <q-timeline color="primary" layout="comfortable" class="q-mb-md">
        <q-timeline-entry
          v-for="workshop in meineRegistriertenWorkshops"
          :key="workshop.id"
          icon="construction"
          :title="workshop.titel"
          :subtitle="formatDate(workshop.anfang_datum_zeit)"
        >
          <q-card class="glass-card q-pa-sm">
            <div class="text-body2">{{ workshop.beschreibung || 'Keine Beschreibung' }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ eventName(workshop.event_id) }} | {{ workshop.raum || 'Raum offen' }}</div>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Details" no-caps />
              <q-btn color="negative" icon="event_busy" label="Abmelden" no-caps unelevated @click="abmelden(workshop.id)" />
            </div>
          </q-card>
        </q-timeline-entry>
      </q-timeline>

      <q-banner v-if="!meineRegistriertenWorkshops.length" class="glass-card q-pa-md q-mb-md">
        Du bist aktuell in keinem Workshop angemeldet.
      </q-banner>

      <template v-if="dbStore.istOrganisator || dbStore.istAdmin">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Meine erstellten Workshops</div>
        <div class="workshop-grid">
          <q-card v-for="workshop in meineOrganisatorWorkshops" :key="workshop.id" class="glass-card q-pa-sm">
            <div class="text-h6 text-weight-bold">{{ workshop.titel }}</div>
            <div class="text-caption text-grey-7">{{ eventName(workshop.event_id) }}</div>
            <div class="text-caption text-grey-7">{{ formatDate(workshop.anfang_datum_zeit) }}</div>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Öffnen" no-caps />
              <q-btn :to="`/veranstaltungen/${workshop.event_id}/workshops`" flat color="primary" icon="edit" label="Verwalten" no-caps />
            </div>
          </q-card>
        </div>

        <q-banner v-if="!meineOrganisatorWorkshops.length" class="glass-card q-pa-md q-mt-md">
          Noch keine eigenen Workshops gefunden.
        </q-banner>
      </template>
    </div>
  </q-page>
</template>

<style scoped>
.workshop-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
</style>
