<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const router = useRouter();
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

function filterAndSort(liste) {
  const text = suche.value.trim().toLowerCase();
  return liste
    .filter((event) => {
      if (!text) return true;
      return event.name.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      const fa = a.friend_count ?? 0;
      const fb = b.friend_count ?? 0;
      if (fb !== fa) return fb - fa;
      return a.name.localeCompare(b.name, 'de');
    });
}

const meineEvents = computed(() =>
  filterAndSort(dbStore.eventMitWorkshops.filter((e) => e.created_by === dbStore.userId)),
);

const andereEvents = computed(() =>
  filterAndSort(dbStore.eventMitWorkshops.filter((e) => e.created_by !== dbStore.userId)),
);

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

</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-7">
          <h1 class="page-title">Alle Events</h1>
          <p class="page-subtitle">Anzahl Events: {{ meineEvents.length + andereEvents.length }}</p>
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

      <template v-if="istEventManager && meineEvents.length">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Meine Events</div>
        <div class="event-grid q-mb-lg">
          <q-card v-for="event in meineEvents" :key="event.id" class="glass-card event-card flex column cursor-pointer" @click="router.push(`/veranstaltungen/${event.id}/workshops`)">
            <q-card-section class="event-card__section col-grow">
              <div class="text-h6 text-weight-bold">{{ event.name }}</div>

              <div class="event-stats q-mt-md">
                <div class="event-stat-line">
                  <span class="text-grey-7">Workshops</span>
                  <span class="text-weight-medium">{{ event.workshop_count ?? 0 }}</span>
                </div>
                <div class="event-stat-line">
                  <span class="text-grey-7">Freunde dabei</span>
                  <div class="friend-avatars" v-if="dbStore.friendsInEvent(event.id).length">
                    <q-avatar
                      v-for="friend in dbStore.friendsInEvent(event.id).slice(0, 5)"
                      :key="friend.id"
                      size="26px"
                      color="primary"
                      text-color="white"
                      class="friend-avatar"
                    >
                      {{ (friend.vorname || '?')[0] }}
                      <q-tooltip :offset="[0, 4]">{{ `${friend.vorname || ''} ${friend.nachname || ''}`.trim() || friend.email }}</q-tooltip>
                    </q-avatar>
                    <q-avatar
                      v-if="dbStore.friendsInEvent(event.id).length > 5"
                      size="26px"
                      color="grey-6"
                      text-color="white"
                      class="friend-avatar"
                    >
                      +{{ dbStore.friendsInEvent(event.id).length - 5 }}
                      <q-tooltip :offset="[0, 4]">{{ dbStore.friendsInEvent(event.id).slice(5).map(f => `${f.vorname || ''} ${f.nachname || ''}`.trim()).join(', ') }}</q-tooltip>
                    </q-avatar>
                  </div>
                  <span v-else class="text-grey-5">0</span>
                </div>
              </div>
            </q-card-section>

            <q-separator class="event-separator" />

            <q-card-actions align="between" class="q-px-md q-pb-md">
              <q-btn :to="`/veranstaltungen/${event.id}/workshops`" flat color="primary" icon="list" label="Workshops" no-caps @click.stop />
              <div class="row q-gutter-xs">
                <q-btn dense flat round icon="edit" color="primary" @click.stop="oeffneEditDialog(event)" />
                <q-btn dense flat round icon="delete" color="negative" @click.stop="loescheEvent(event)" />
              </div>
            </q-card-actions>
          </q-card>
        </div>

        <q-separator class="q-mb-lg" />
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Andere Events</div>
      </template>

      <div class="event-grid">
        <q-card v-for="event in andereEvents" :key="event.id" class="glass-card event-card flex column cursor-pointer" @click="router.push(`/veranstaltungen/${event.id}/workshops`)">
          <q-card-section class="event-card__section col-grow">
            <div class="text-h6 text-weight-bold">{{ event.name }}</div>

            <div class="event-stats q-mt-md">
              <div class="event-stat-line">
                <span class="text-grey-7">Workshops</span>
                <span class="text-weight-medium">{{ event.workshop_count ?? 0 }}</span>
              </div>
              <div class="event-stat-line">
                <span class="text-grey-7">Freunde dabei</span>
                <div class="friend-avatars" v-if="dbStore.friendsInEvent(event.id).length">
                  <q-avatar
                    v-for="friend in dbStore.friendsInEvent(event.id).slice(0, 5)"
                    :key="friend.id"
                    size="26px"
                    color="primary"
                    text-color="white"
                    class="friend-avatar"
                  >
                    {{ (friend.vorname || '?')[0] }}
                    <q-tooltip :offset="[0, 4]">{{ `${friend.vorname || ''} ${friend.nachname || ''}`.trim() || friend.email }}</q-tooltip>
                  </q-avatar>
                  <q-avatar
                    v-if="dbStore.friendsInEvent(event.id).length > 5"
                    size="26px"
                    color="grey-6"
                    text-color="white"
                    class="friend-avatar"
                  >
                    +{{ dbStore.friendsInEvent(event.id).length - 5 }}
                    <q-tooltip :offset="[0, 4]">{{ dbStore.friendsInEvent(event.id).slice(5).map(f => `${f.vorname || ''} ${f.nachname || ''}`.trim()).join(', ') }}</q-tooltip>
                  </q-avatar>
                </div>
                <span v-else class="text-grey-5">0</span>
              </div>
            </div>
          </q-card-section>

          <q-separator class="event-separator" />

          <q-card-actions align="between" class="q-px-md q-pb-md">
            <q-btn :to="`/veranstaltungen/${event.id}/workshops`" flat color="primary" icon="list" label="Workshops" no-caps @click.stop />
          </q-card-actions>
        </q-card>
      </div>

      <q-banner v-if="!meineEvents.length && !andereEvents.length" class="glass-card q-pa-md q-mt-md">
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
</style>
