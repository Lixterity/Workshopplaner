<script setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const gewaehlterWorkshop = ref(null);
const suchtext = ref('');

const workshopOptionen = computed(() => {
  const liste = dbStore.istAdmin
    ? dbStore.workshops
    : dbStore.workshops.filter((w) => w.created_by === dbStore.userId);

  return liste.map((w) => ({
    label: w.titel,
    value: w.id,
    caption: `${dbStore.workshopBelegung(w.id)} / ${w.kapazitaet ?? '∞'} Teilnehmer`,
  }));
});

const workshop = computed(() =>
  gewaehlterWorkshop.value ? dbStore.getWorkshopById(gewaehlterWorkshop.value) : null,
);

const angemeldete = computed(() => {
  if (!gewaehlterWorkshop.value) return [];
  return dbStore.getWorkshopAnmeldungen(gewaehlterWorkshop.value);
});

const belegung = computed(() =>
  gewaehlterWorkshop.value ? dbStore.workshopBelegung(gewaehlterWorkshop.value) : 0,
);

const angemeldeteIds = computed(() => new Set(angemeldete.value.map((p) => p.auth_user_id)));

const einladbare = computed(() => {
  return dbStore.teilnehmer.filter((person) => {
    if (!person.auth_user_id) return false;
    if (angemeldeteIds.value.has(person.auth_user_id)) return false;
    const text = suchtext.value.trim().toLowerCase();
    if (!text) return true;
    const name = `${person.vorname} ${person.nachname}`.toLowerCase();
    return name.includes(text) || (person.email || '').toLowerCase().includes(text);
  });
});

function fullName(person) {
  return `${person.vorname} ${person.nachname}`.trim();
}

async function einladen(person) {
  if (!gewaehlterWorkshop.value) {
    $q.notify({ type: 'warning', message: 'Bitte zuerst einen Workshop wählen.' });
    return;
  }
  const { error } = await dbStore.einladeZuWorkshop(person.auth_user_id, gewaehlterWorkshop.value);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({
    type: 'positive',
    message: `${fullName(person)} wurde zu "${workshop.value?.titel}" eingeladen.`,
  });
}
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="q-mb-md">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Teilnehmer zu deinen Workshops einladen und Anmeldungen verwalten.</p>
      </div>

      <q-select
        v-model="gewaehlterWorkshop"
        outlined
        dense
        emit-value
        map-options
        :options="workshopOptionen"
        label="Workshop auswählen"
        class="q-mb-md"
      >
        <template #option="{ itemProps, opt }">
          <q-item v-bind="itemProps">
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label caption>{{ opt.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">Keine Workshops vorhanden.</q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-banner v-if="!gewaehlterWorkshop" class="glass-card q-pa-lg text-center">
        <q-icon name="touch_app" size="48px" color="grey-5" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-bold">Workshop auswählen</div>
        <div class="text-caption text-grey-7 q-mt-xs">Wähle einen Workshop aus der Liste, um Teilnehmer zu verwalten.</div>
      </q-banner>

      <div v-else class="dashboard-grid">
        <section class="glass-card q-pa-md">
          <div class="section-header">
            <div class="text-subtitle1 text-weight-bold">Angemeldete Teilnehmer</div>
            <q-chip dense outline color="primary">{{ belegung }} / {{ workshop?.kapazitaet ?? '∞' }}</q-chip>
          </div>
          <q-list bordered separator class="rounded-borders q-mt-sm teilnehmer-liste" v-if="angemeldete.length">
            <q-item v-for="person in angemeldete" :key="person.id">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">{{ (person.vorname || '?')[0] }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ fullName(person) }}</q-item-label>
                <q-item-label caption>{{ person.email }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="q-mt-sm text-grey-6">Noch keine Anmeldungen.</q-banner>
        </section>

        <section class="glass-card q-pa-md dashboard-right">
          <div class="section-header">
            <div class="text-subtitle1 text-weight-bold">Teilnehmer einladen</div>
            <q-badge rounded color="grey-6" :label="einladbare.length" />
          </div>
          <q-input v-model="suchtext" outlined dense clearable label="Suche nach Name oder E-Mail" class="q-mt-sm">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <q-list bordered separator class="rounded-borders q-mt-sm personen-liste" v-if="einladbare.length">
            <q-item v-for="person in einladbare" :key="person.id">
              <q-item-section avatar>
                <q-avatar color="grey-4" text-color="grey-8" size="32px">{{ (person.vorname || '?')[0] }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ fullName(person) }}</q-item-label>
                <q-item-label caption>{{ person.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn dense flat round color="primary" icon="person_add" @click="einladen(person)">
                  <q-tooltip :offset="[0, 4]">Zu Workshop einladen</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="q-mt-sm text-grey-6">Keine einladbaren Personen gefunden.</q-banner>
        </section>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.2fr 1fr;
  align-items: start;
}

.dashboard-right {
  position: sticky;
  top: 80px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.teilnehmer-liste,
.personen-liste {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-right {
    position: static;
  }
}
</style>
