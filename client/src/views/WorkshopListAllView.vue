<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const router = useRouter();
const dbStore = useDbStore();
const $q = useQuasar();

const suchtext = ref('');
const eventFilter = ref(null);
const nurMitPlaetzen = ref(false);

const istManager = computed(() => dbStore.istOrganisator || dbStore.istAdmin);

const eventOptionen = computed(() => [
  { label: 'Alle Events', value: null },
  ...dbStore.events.map((event) => ({ label: event.name, value: event.id })),
]);

function filterAndSort(liste) {
  const text = suchtext.value.trim().toLowerCase();

  return liste
    .filter((workshop) => {
      if (eventFilter.value && String(workshop.event_id) !== String(eventFilter.value)) {
        return false;
      }

      const frei = (workshop.kapazitaet ?? 999999) - dbStore.workshopBelegung(workshop.id);
      if (nurMitPlaetzen.value && frei <= 0) {
        return false;
      }

      if (!text) {
        return true;
      }

      return (
        (workshop.titel || '').toLowerCase().includes(text) ||
        (workshop.beschreibung || '').toLowerCase().includes(text) ||
        (workshop.raum || '').toLowerCase().includes(text)
      );
    })
    .sort((a, b) => {
      const fa = dbStore.friendCountForWorkshop(a.id);
      const fb = dbStore.friendCountForWorkshop(b.id);
      if (fb !== fa) return fb - fa;
      return (a.titel || '').localeCompare(b.titel || '', 'de');
    });
}

const meineWorkshops = computed(() =>
  filterAndSort(dbStore.workshops.filter((w) => w.created_by === dbStore.userId)),
);

const andereWorkshops = computed(() =>
  filterAndSort(dbStore.workshops.filter((w) => w.created_by !== dbStore.userId)),
);

// ── Workshop create/edit dialog ──

const workshopDialog = ref(false);
const workshopSaving = ref(false);

const eventAuswahl = computed(() =>
  dbStore.events.map((e) => ({ label: e.name, value: e.id })),
);

const workshopForm = ref({
  id: null,
  titel: '',
  beschreibung: '',
  kapazitaet: 20,
  raum: '',
  adresse: '',
  kosten: 0,
  anfang_datum_zeit: '',
  ende_datum_zeit: '',
  public: true,
  event_id: null,
});

// ── New-event inline creation ──
const neuesEventDialog = ref(false);
const neuesEventForm = ref({ name: '', public: true });
const neuesEventSaving = ref(false);

function openCreate() {
  workshopForm.value = {
    id: null,
    titel: '',
    beschreibung: '',
    kapazitaet: 20,
    raum: '',
    adresse: '',
    kosten: 0,
    anfang_datum_zeit: '',
    ende_datum_zeit: '',
    public: true,
    event_id: null,
  };
  workshopDialog.value = true;
}

function openEdit(workshop) {
  workshopForm.value = {
    id: workshop.id,
    titel: workshop.titel,
    beschreibung: workshop.beschreibung,
    kapazitaet: workshop.kapazitaet,
    raum: workshop.raum,
    adresse: workshop.adresse,
    kosten: workshop.kosten,
    anfang_datum_zeit: workshop.anfang_datum_zeit,
    ende_datum_zeit: workshop.ende_datum_zeit,
    public: workshop.public,
    event_id: workshop.event_id,
  };
  workshopDialog.value = true;
}

async function saveWorkshop() {
  if (!workshopForm.value.titel || !workshopForm.value.anfang_datum_zeit || !workshopForm.value.ende_datum_zeit) {
    $q.notify({ type: 'warning', message: 'Bitte Titel und Zeitraum ausfüllen.' });
    return;
  }
  if (!workshopForm.value.event_id) {
    $q.notify({ type: 'warning', message: 'Bitte ein Event auswählen.' });
    return;
  }

  workshopSaving.value = true;
  const action = workshopForm.value.id
    ? dbStore.updateWorkshop(workshopForm.value.id, workshopForm.value)
    : dbStore.createWorkshop(workshopForm.value);

  const { error } = await action;
  workshopSaving.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: `Workshop speichern fehlgeschlagen: ${error.message}` });
    return;
  }

  workshopDialog.value = false;
  $q.notify({ type: 'positive', message: 'Workshop gespeichert.' });
}

async function deleteWorkshop(workshop) {
  $q.dialog({ title: 'Löschen', message: `Workshop "${workshop.titel}" löschen?`, cancel: true, persistent: true }).onOk(
    async () => {
      const { error } = await dbStore.deleteWorkshop(workshop.id);
      if (error) {
        $q.notify({ type: 'negative', message: `Löschen fehlgeschlagen: ${error.message}` });
        return;
      }
      $q.notify({ type: 'positive', message: 'Workshop gelöscht.' });
    },
  );
}

function openNeuesEvent() {
  neuesEventForm.value = { name: '', public: true };
  neuesEventDialog.value = true;
}

async function speichereNeuesEvent() {
  if (!neuesEventForm.value.name.trim()) {
    $q.notify({ type: 'warning', message: 'Bitte gib einen Eventnamen ein.' });
    return;
  }
  neuesEventSaving.value = true;
  const { data, error } = await dbStore.createEvent(neuesEventForm.value);
  neuesEventSaving.value = false;

  if (error) {
    $q.notify({ type: 'negative', message: `Event erstellen fehlgeschlagen: ${error.message}` });
    return;
  }

  neuesEventDialog.value = false;
  workshopForm.value.event_id = data.id;
  $q.notify({ type: 'positive', message: 'Event erstellt und ausgewählt.' });
}

// ── Helpers ──

function eventName(eventId) {
  return dbStore.getEventById(eventId)?.name || `Event #${eventId}`;
}

function formatRange(workshop) {
  const start = workshop.anfang_datum_zeit ? new Date(workshop.anfang_datum_zeit) : null;
  const ende = workshop.ende_datum_zeit ? new Date(workshop.ende_datum_zeit) : null;

  if (!start || !ende || Number.isNaN(start.getTime()) || Number.isNaN(ende.getTime())) {
    return 'Zeitraum offen';
  }

  const dateFmt = new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFmt.format(start)} - ${dateFmt.format(ende)}`;
}

function freiePlaetze(workshop) {
  if (!workshop.kapazitaet && workshop.kapazitaet !== 0) return null;
  return workshop.kapazitaet - dbStore.workshopBelegung(workshop.id);
}

async function toggleAnmeldung(workshop) {
  const istRegistriert = dbStore.isRegisteredForWorkshop(workshop.id);
  const result = istRegistriert
    ? await dbStore.workshopAbmelden(workshop.id)
    : await dbStore.workshopAnmelden(workshop.id);

  if (result.error) {
    $q.notify({ type: 'negative', message: result.error.message, multiLine: true, classes: 'notify-compact' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: istRegistriert ? 'Du bist jetzt abgemeldet.' : 'Du bist jetzt angemeldet.',
  });
}
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-7">
          <h1 class="page-title">Liste der Workshops</h1>
          <p class="page-subtitle">Melde dich direkt an oder ab. Bei Zeitkollisionen wird die Anmeldung blockiert.</p>
        </div>
        <div class="col-12 col-md-auto" v-if="istManager">
          <q-btn color="primary" icon="add" label="Workshop erstellen" no-caps unelevated @click="openCreate" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <q-input v-model="suchtext" outlined dense clearable label="Workshops durchsuchen">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-select v-model="eventFilter" emit-value map-options :options="eventOptionen" outlined dense label="Event" />
        </div>
        <div class="col-12 col-md-2">
          <q-toggle v-model="nurMitPlaetzen" color="primary" label="Nur frei" />
        </div>
      </div>

      <!-- Own workshops section (organisators / admins) -->
      <template v-if="istManager && meineWorkshops.length">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Meine Workshops</div>
        <div class="workshop-grid q-mb-lg">
          <q-card v-for="workshop in meineWorkshops" :key="workshop.id" class="glass-card workshop-card flex column cursor-pointer" @click="router.push(`/workshops/${workshop.id}`)">
            <q-card-section class="workshop-card__section col-grow">
              <div class="text-overline workshop-overline">{{ eventName(workshop.event_id) }}</div>
              <div class="text-h6 text-weight-bold">{{ workshop.titel }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ formatRange(workshop) }}</div>
              <div class="text-body2 q-mt-sm workshop-description">{{ workshop.beschreibung || 'Keine Beschreibung vorhanden.' }}</div>

              <div class="workshop-meta q-mt-md">
                <div class="workshop-meta__item">
                  <q-icon name="meeting_room" size="18px" color="primary" />
                  <span>{{ workshop.raum || 'Raum offen' }}</span>
                </div>
                <div class="workshop-meta__item">
                  <q-icon name="groups" size="18px" color="primary" />
                  <span>{{ dbStore.workshopBelegung(workshop.id) }} / {{ workshop.kapazitaet ?? '∞' }} Plätze</span>
                </div>
                <div class="workshop-meta__item">
                  <q-icon name="group" size="18px" color="primary" />
                  <span>{{ dbStore.friendCountForWorkshop(workshop.id) }} Freunde</span>
                </div>
              </div>

              <div class="friend-avatars q-mt-xs" v-if="dbStore.friendsInWorkshop(workshop.id).length">
                <q-avatar
                  v-for="friend in dbStore.friendsInWorkshop(workshop.id).slice(0, 5)"
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
                  v-if="dbStore.friendsInWorkshop(workshop.id).length > 5"
                  size="28px"
                  color="grey-6"
                  text-color="white"
                  class="friend-avatar"
                >
                  +{{ dbStore.friendsInWorkshop(workshop.id).length - 5 }}
                  <q-tooltip :offset="[0, 4]">{{ dbStore.friendsInWorkshop(workshop.id).slice(5).map(f => `${f.vorname || ''} ${f.nachname || ''}`.trim()).join(', ') }}</q-tooltip>
                </q-avatar>
              </div>

              <div class="q-mt-sm" v-if="freiePlaetze(workshop) !== null">
                <q-badge
                  rounded
                  :color="freiePlaetze(workshop) > 0 ? 'positive' : 'negative'"
                  text-color="white"
                  class="q-px-sm q-py-xs"
                >
                  {{ freiePlaetze(workshop) > 0 ? `${freiePlaetze(workshop)} Plätze frei` : 'Ausgebucht' }}
                </q-badge>
              </div>
            </q-card-section>

            <q-separator />
            <q-card-actions align="between">
              <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Details" no-caps @click.stop />
              <div class="row q-gutter-xs items-center">
                <q-btn
                  :color="dbStore.isRegisteredForWorkshop(workshop.id) ? 'negative' : 'primary'"
                  :icon="dbStore.isRegisteredForWorkshop(workshop.id) ? 'event_busy' : 'event_available'"
                  :label="dbStore.isRegisteredForWorkshop(workshop.id) ? 'Abmelden' : 'Anmelden'"
                  no-caps
                  unelevated
                  @click.stop="toggleAnmeldung(workshop)"
                />
                <q-btn dense flat round icon="edit" color="primary" @click.stop="openEdit(workshop)" />
                <q-btn dense flat round icon="delete" color="negative" @click.stop="deleteWorkshop(workshop)" />
              </div>
            </q-card-actions>
          </q-card>
        </div>

        <q-separator class="q-mb-lg" />
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Andere Workshops</div>
      </template>

      <!-- Other workshops (or all for non-organisators) -->
      <div class="workshop-grid">
        <q-card v-for="workshop in andereWorkshops" :key="workshop.id" class="glass-card workshop-card flex column cursor-pointer" @click="router.push(`/workshops/${workshop.id}`)">
          <q-card-section class="workshop-card__section col-grow">
            <div class="text-overline workshop-overline">{{ eventName(workshop.event_id) }}</div>
            <div class="text-h6 text-weight-bold">{{ workshop.titel }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ formatRange(workshop) }}</div>
            <div class="text-body2 q-mt-sm workshop-description">{{ workshop.beschreibung || 'Keine Beschreibung vorhanden.' }}</div>

            <div class="workshop-meta q-mt-md">
              <div class="workshop-meta__item">
                <q-icon name="meeting_room" size="18px" color="primary" />
                <span>{{ workshop.raum || 'Raum offen' }}</span>
              </div>
              <div class="workshop-meta__item">
                <q-icon name="groups" size="18px" color="primary" />
                <span>{{ dbStore.workshopBelegung(workshop.id) }} / {{ workshop.kapazitaet ?? '∞' }} Plätze</span>
              </div>
              <div class="workshop-meta__item">
                <q-icon name="group" size="18px" color="primary" />
                <span>{{ dbStore.friendCountForWorkshop(workshop.id) }} Freunde</span>
              </div>
            </div>

            <div class="friend-avatars q-mt-xs" v-if="dbStore.friendsInWorkshop(workshop.id).length">
              <q-avatar
                v-for="friend in dbStore.friendsInWorkshop(workshop.id).slice(0, 5)"
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
                v-if="dbStore.friendsInWorkshop(workshop.id).length > 5"
                size="28px"
                color="grey-6"
                text-color="white"
                class="friend-avatar"
              >
                +{{ dbStore.friendsInWorkshop(workshop.id).length - 5 }}
                <q-tooltip :offset="[0, 4]">{{ dbStore.friendsInWorkshop(workshop.id).slice(5).map(f => `${f.vorname || ''} ${f.nachname || ''}`.trim()).join(', ') }}</q-tooltip>
              </q-avatar>
            </div>

            <div class="q-mt-sm" v-if="freiePlaetze(workshop) !== null">
              <q-badge
                rounded
                :color="freiePlaetze(workshop) > 0 ? 'positive' : 'negative'"
                text-color="white"
                class="q-px-sm q-py-xs"
              >
                {{ freiePlaetze(workshop) > 0 ? `${freiePlaetze(workshop)} Plätze frei` : 'Ausgebucht' }}
              </q-badge>
            </div>
          </q-card-section>

          <q-separator />
          <q-card-actions align="between">
            <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Details" no-caps @click.stop />
            <q-btn
              :color="dbStore.isRegisteredForWorkshop(workshop.id) ? 'negative' : 'primary'"
              :icon="dbStore.isRegisteredForWorkshop(workshop.id) ? 'event_busy' : 'event_available'"
              :label="dbStore.isRegisteredForWorkshop(workshop.id) ? 'Abmelden' : 'Anmelden'"
              no-caps
              unelevated
              @click.stop="toggleAnmeldung(workshop)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <q-banner v-if="!meineWorkshops.length && !andereWorkshops.length" class="glass-card q-pa-md q-mt-md">Keine Workshops für die aktuelle Auswahl gefunden.</q-banner>
    </div>

    <!-- Workshop create/edit dialog -->
    <q-dialog v-model="workshopDialog">
      <q-card class="glass-card" style="width: min(760px, 96vw)">
        <q-card-section>
          <div class="text-h6">{{ workshopForm.id ? 'Workshop bearbeiten' : 'Workshop erstellen' }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm items-end">
            <div class="col">
              <q-select
                v-model="workshopForm.event_id"
                outlined
                dense
                emit-value
                map-options
                :options="eventAuswahl"
                label="Event zuordnen"
              />
            </div>
            <div class="col-auto">
              <q-btn flat color="primary" icon="add" label="Neues Event" no-caps @click="openNeuesEvent" />
            </div>
          </div>

          <q-input v-model="workshopForm.titel" outlined dense label="Titel" />
          <q-input v-model="workshopForm.beschreibung" type="textarea" autogrow outlined dense label="Beschreibung" />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model.number="workshopForm.kapazitaet" outlined dense type="number" label="Kapazität" min="0" /></div>
            <div class="col-12 col-md-6"><q-input v-model.number="workshopForm.kosten" outlined dense type="number" label="Kosten" min="0" /></div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model="workshopForm.raum" outlined dense label="Raum" /></div>
            <div class="col-12 col-md-6"><q-input v-model="workshopForm.adresse" outlined dense label="Adresse" /></div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6"><q-input v-model="workshopForm.anfang_datum_zeit" outlined dense type="datetime-local" label="Beginn" /></div>
            <div class="col-12 col-md-6"><q-input v-model="workshopForm.ende_datum_zeit" outlined dense type="datetime-local" label="Ende" /></div>
          </div>

          <q-toggle v-model="workshopForm.public" color="primary" label="Workshop öffentlich" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup no-caps />
          <q-btn color="primary" :loading="workshopSaving" label="Speichern" no-caps unelevated @click="saveWorkshop" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Inline new event dialog -->
    <q-dialog v-model="neuesEventDialog">
      <q-card class="glass-card" style="min-width: min(420px, 92vw)">
        <q-card-section>
          <div class="text-h6">Neues Event erstellen</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="neuesEventForm.name" outlined dense label="Eventname" />
          <q-toggle v-model="neuesEventForm.public" color="primary" label="Event öffentlich" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup no-caps />
          <q-btn color="primary" :loading="neuesEventSaving" label="Erstellen" no-caps unelevated @click="speichereNeuesEvent" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.workshop-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.workshop-card {
  border-radius: 18px;
}

.workshop-card__section {
  padding: 18px 18px 10px;
}

.workshop-overline {
  color: var(--q-primary);
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workshop-card .text-h6 {
  word-break: break-word;
}

.workshop-description {
  min-height: 48px;
}

.workshop-meta {
  display: grid;
  gap: 8px;
}

.workshop-meta__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 500;
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
