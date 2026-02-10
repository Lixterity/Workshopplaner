<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const suche = ref('');

const eventDialog = ref(false);
const eventForm = ref({
  id: null,
  name: '',
  public: true,
});
const eventSaving = ref(false);

const istEventManager = computed(() => dbStore.istOrganisator || dbStore.istAdmin);

const gefilterteEvents = computed(() => {
  const text = suche.value.trim().toLowerCase();
  return dbStore.eventMitWorkshops.filter((event) => {
    if (!text) return true;
    return event.name.toLowerCase().includes(text);
  });
});

function isOwner(event) {
  return dbStore.canEditEvent(event);
}

function oeffneNeuDialog() {
  eventForm.value = { id: null, name: '', public: true };
  eventDialog.value = true;
}

function oeffneEditDialog(event) {
  if (!isOwner(event)) {
    $q.notify({ type: 'warning', message: 'Du kannst nur deine eigenen Events bearbeiten.' });
    return;
  }
  eventForm.value = { id: event.id, name: event.name, public: Boolean(event.public) };
  eventDialog.value = true;
}

async function speichereEvent() {
  if (!eventForm.value.name.trim()) {
    $q.notify({ type: 'warning', message: 'Bitte gib einen Eventnamen ein.' });
    return;
  }

  eventSaving.value = true;
  let result;

  if (eventForm.value.id) {
    result = await dbStore.updateEvent(eventForm.value.id, eventForm.value);
  } else {
    result = await dbStore.createEvent(eventForm.value);
  }

  eventSaving.value = false;

  if (result.error) {
    $q.notify({ type: 'negative', message: `Event konnte nicht gespeichert werden: ${result.error.message}` });
    return;
  }

  eventDialog.value = false;
  $q.notify({ type: 'positive', message: 'Event gespeichert.' });
}

async function loescheEvent(event) {
  if (!isOwner(event)) {
    $q.notify({ type: 'warning', message: 'Du kannst nur deine eigenen Events löschen.' });
    return;
  }

  $q.dialog({
    title: 'Event löschen',
    message: `Soll "${event.name}" wirklich gelöscht werden?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const { error } = await dbStore.deleteEvent(event.id);
    if (error) {
      $q.notify({ type: 'negative', message: `Löschen fehlgeschlagen: ${error.message}` });
      return;
    }
    $q.notify({ type: 'positive', message: 'Event wurde gelöscht.' });
  });
}

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-7">
          <h1 class="page-title">Alle Events</h1>
          <p class="page-subtitle">Anzahl Events: {{ gefilterteEvents.length }}</p>
        </div>
        <div class="col-12 col-md-auto" v-if="istEventManager">
          <q-btn color="primary" icon="add" label="Event erstellen" no-caps unelevated @click="oeffneNeuDialog" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <q-input v-model="suche" outlined dense label="Events durchsuchen" clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
      </div>

      <div class="event-grid">
        <q-card v-for="event in gefilterteEvents" :key="event.id" class="glass-card event-card">
          <q-card-section class="event-card__section">
            <div class="text-h6 text-weight-bold">{{ event.name }}</div>

            <div class="event-stats q-mt-md">
              <div class="event-stat-line">
                <span class="text-grey-7">Workshops</span>
                <span class="text-weight-medium">{{ event.workshop_count ?? 0 }}</span>
              </div>
              <div class="event-stat-line">
                <span class="text-grey-7">Freunde dabei</span>
                <q-badge
                  rounded
                  :color="(event.friend_count ?? 0) > 0 ? 'primary' : 'grey-7'"
                  text-color="white"
                  class="q-px-sm q-py-xs"
                >
                  {{ event.friend_count ?? 0 }}
                </q-badge>
              </div>
            </div>
          </q-card-section>

          <q-separator class="event-separator" />

          <q-card-actions align="between" class="q-px-md q-pb-md">
            <q-btn :to="`/veranstaltungen/${event.id}/workshops`" flat color="primary" icon="list" label="Workshops" no-caps />
            <div v-if="istEventManager" class="row q-gutter-xs">
              <q-btn dense flat round icon="edit" color="primary" @click="oeffneEditDialog(event)" />
              <q-btn dense flat round icon="delete" color="negative" @click="loescheEvent(event)" />
            </div>
          </q-card-actions>
        </q-card>
      </div>

      <q-banner v-if="!gefilterteEvents.length" class="glass-card q-pa-md q-mt-md">
        Keine Events gefunden.
      </q-banner>
    </div>

    <q-dialog v-model="eventDialog">
      <q-card class="glass-card" style="min-width: min(500px, 92vw)">
        <q-card-section>
          <div class="text-h6">{{ eventForm.id ? 'Event bearbeiten' : 'Event erstellen' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="eventForm.name" outlined dense label="Eventname" />
          <q-toggle v-model="eventForm.public" color="primary" label="Event öffentlich" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup no-caps />
          <q-btn color="primary" :loading="eventSaving" label="Speichern" no-caps unelevated @click="speichereEvent" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.event-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.event-card {
  border-radius: 18px;
}

.event-card__section {
  padding: 18px 18px 10px;
}

.event-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-stat-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 500;
}

.event-separator {
  opacity: 0.65;
}
</style>
