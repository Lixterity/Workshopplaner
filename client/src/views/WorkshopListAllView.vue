<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const suchtext = ref('');
const eventFilter = ref(null);
const nurMitPlaetzen = ref(false);

const eventOptionen = computed(() => [
  { label: 'Alle Events', value: null },
  ...dbStore.events.map((event) => ({ label: event.name, value: event.id })),
]);

const workshopListe = computed(() => {
  const text = suchtext.value.trim().toLowerCase();

  return dbStore.workshops.filter((workshop) => {
    if (eventFilter.value && String(workshop.event_id) !== String(eventFilter.value)) {
      return false;
    }

    const freiePlaetze = (workshop.kapazitaet ?? 999999) - dbStore.workshopBelegung(workshop.id);
    if (nurMitPlaetzen.value && freiePlaetze <= 0) {
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
  });
});

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
    $q.notify({ type: 'negative', message: result.error.message });
    return;
  }

  $q.notify({
    type: 'positive',
    message: istRegistriert ? 'Du bist jetzt abgemeldet.' : 'Du bist jetzt angemeldet.',
  });
}

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="q-mb-md">
        <h1 class="page-title">Liste der Workshops</h1>
        <p class="page-subtitle">Melde dich direkt an oder ab. Bei Zeitkollisionen wird die Anmeldung blockiert.</p>
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

      <div class="workshop-grid">
        <q-card v-for="workshop in workshopListe" :key="workshop.id" class="glass-card workshop-card">
          <q-card-section class="workshop-card__section">
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
            <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Details" no-caps />
            <q-btn
              :color="dbStore.isRegisteredForWorkshop(workshop.id) ? 'negative' : 'primary'"
              :icon="dbStore.isRegisteredForWorkshop(workshop.id) ? 'event_busy' : 'event_available'"
              :label="dbStore.isRegisteredForWorkshop(workshop.id) ? 'Abmelden' : 'Anmelden'"
              no-caps
              unelevated
              @click="toggleAnmeldung(workshop)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <q-banner v-if="!workshopListe.length" class="glass-card q-pa-md q-mt-md">Keine Workshops für die aktuelle Auswahl gefunden.</q-banner>
    </div>
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
</style>

