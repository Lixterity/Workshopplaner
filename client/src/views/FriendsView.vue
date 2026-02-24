<script setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const suchtext = ref('');

const vorschlaege = computed(() => {
  const text = suchtext.value.trim().toLowerCase();
  return dbStore.verfuegbareFreunde.filter((person) => {
    if (!text) return true;
    const name = `${person.vorname} ${person.nachname}`.toLowerCase();
    return name.includes(text) || (person.email || '').toLowerCase().includes(text);
  });
});

function fullName(item) {
  return `${item.vorname} ${item.nachname}`.trim();
}

function resolveName(authUserId) {
  const t = dbStore.resolveTeilnehmerByAuthUserId(authUserId);
  return t ? fullName(t) : 'Unbekannt';
}

async function sendeAnfrage(person) {
  const { error } = await dbStore.sendeFreundschaftsanfrage(person.auth_user_id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: `Anfrage an ${fullName(person)} gesendet.` });
}

async function annehmen(item) {
  const { error } = await dbStore.freundschaftAnnehmen(item.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Anfrage angenommen.' });
}

async function ablehnen(item) {
  const { error } = await dbStore.freundschaftAblehnen(item.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Anfrage abgelehnt.' });
}

async function entfernen(friend) {
  const { error } = await dbStore.freundEntfernen(friend.auth_user_id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: `${fullName(friend)} wurde entfernt.` });
}
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="q-mb-md">
        <h1 class="page-title">Freunde</h1>
        <p class="page-subtitle">Sende Anfragen, nimm sie an und sieh später, wo deine Freunde teilnehmen.</p>
      </div>

      <div class="friends-grid">
        <!-- Left column: Friends + Requests -->
        <div class="friends-left">
          <section class="glass-card q-pa-md">
            <div class="section-header">
              <div class="text-subtitle1 text-weight-bold">Meine Freunde</div>
              <q-badge v-if="dbStore.freunde.length" rounded color="grey-6" :label="dbStore.freunde.length" />
            </div>
            <q-list bordered separator class="rounded-borders q-mt-sm" v-if="dbStore.freunde.length">
              <q-item v-for="friend in dbStore.freunde" :key="friend.id">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="36px">{{ (friend.vorname || '?')[0] }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ fullName(friend) }}</q-item-label>
                  <q-item-label caption>{{ friend.email }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn dense flat round color="negative" icon="person_remove" @click="entfernen(friend)" />
                </q-item-section>
              </q-item>
            </q-list>
            <q-banner v-else class="state-box q-mt-sm">Noch keine Freunde vorhanden.</q-banner>
          </section>

          <section class="glass-card q-pa-md">
            <div class="section-header">
              <div class="text-subtitle1 text-weight-bold">Eingehende Anfragen</div>
              <q-badge v-if="dbStore.offeneFreundschaftsanfragen.length" rounded color="primary" :label="dbStore.offeneFreundschaftsanfragen.length" />
            </div>
            <q-list bordered separator class="rounded-borders q-mt-sm" v-if="dbStore.offeneFreundschaftsanfragen.length">
              <q-item v-for="item in dbStore.offeneFreundschaftsanfragen" :key="item.id">
                <q-item-section avatar>
                  <q-avatar color="grey-4" text-color="grey-8" size="36px">{{ (resolveName(item.absender_id) || '?')[0] }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ resolveName(item.absender_id) }}</q-item-label>
                  <q-item-label caption>möchte dein Freund sein</q-item-label>
                </q-item-section>
                <q-item-section side class="row q-gutter-xs">
                  <q-btn dense round color="primary" icon="check" @click="annehmen(item)" />
                  <q-btn dense round flat color="negative" icon="close" @click="ablehnen(item)" />
                </q-item-section>
              </q-item>
            </q-list>
            <q-banner v-else class="state-box q-mt-sm">Keine offenen Anfragen.</q-banner>

            <div class="section-header q-mt-md">
              <div class="text-subtitle1 text-weight-bold">Gesendete Anfragen</div>
              <q-badge v-if="dbStore.gesendeteFreundschaftsanfragen.length" rounded color="grey-6" :label="dbStore.gesendeteFreundschaftsanfragen.length" />
            </div>
            <q-list bordered separator class="rounded-borders q-mt-sm" v-if="dbStore.gesendeteFreundschaftsanfragen.length">
              <q-item v-for="item in dbStore.gesendeteFreundschaftsanfragen" :key="item.id">
                <q-item-section avatar>
                  <q-avatar color="grey-4" text-color="grey-8" size="36px">{{ (resolveName(item.empfaenger_id) || '?')[0] }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ resolveName(item.empfaenger_id) }}</q-item-label>
                  <q-item-label caption>wartet auf Antwort</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <q-banner v-else class="state-box q-mt-sm">Keine gesendeten Anfragen.</q-banner>
          </section>
        </div>

        <!-- Right column: Find people -->
        <section class="glass-card q-pa-md friends-right">
          <div class="section-header">
            <div class="text-subtitle1 text-weight-bold">Personen finden</div>
            <q-badge rounded color="grey-6" :label="vorschlaege.length" />
          </div>
          <q-input v-model="suchtext" outlined dense clearable label="Suche nach Name oder E-Mail" class="q-mt-sm">
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <q-list bordered separator class="rounded-borders q-mt-sm personen-liste" v-if="vorschlaege.length">
            <q-item v-for="person in vorschlaege" :key="person.id">
              <q-item-section avatar>
                <q-avatar color="grey-4" text-color="grey-8" size="32px">{{ (person.vorname || '?')[0] }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ fullName(person) }}</q-item-label>
                <q-item-label caption>{{ person.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn dense flat round color="primary" icon="person_add" @click="sendeAnfrage(person)">
                  <q-tooltip :offset="[0, 4]">Anfrage senden</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="state-box q-mt-sm">Keine Personen verfügbar.</q-banner>
        </section>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.friends-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.2fr 1fr;
  align-items: start;
}

.friends-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.friends-right {
  position: sticky;
  top: 80px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.personen-liste {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .friends-grid {
    grid-template-columns: 1fr;
  }

  .friends-right {
    position: static;
  }
}
</style>
