<script setup>
import { computed, onMounted, ref } from 'vue';
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

function sendeAnfrage(person) {
  const { error } = dbStore.sendeFreundschaftsanfrage(person.auth_user_id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: `Anfrage an ${fullName(person)} gesendet.` });
}

function annehmen(item) {
  const { error } = dbStore.freundschaftAnnehmen(item.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Anfrage angenommen.' });
}

function ablehnen(item) {
  const { error } = dbStore.freundschaftAblehnen(item.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: 'Anfrage abgelehnt.' });
}

function entfernen(friend) {
  const { error } = dbStore.freundEntfernen(friend.auth_user_id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: `${fullName(friend)} wurde entfernt.` });
}

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max friends-layout">
      <section class="glass-card q-pa-md">
        <h1 class="page-title">Freunde</h1>
        <p class="page-subtitle">Sende Anfragen, nimm sie an und sieh später, wo deine Freunde teilnehmen.</p>

        <div class="text-subtitle1 text-weight-bold q-mt-lg q-mb-sm">Meine Freunde</div>
        <q-list bordered separator class="rounded-borders" v-if="dbStore.freunde.length">
          <q-item v-for="friend in dbStore.freunde" :key="friend.id">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">{{ (friend.vorname || '?')[0] }}</q-avatar>
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
        <q-banner v-else class="state-box">Noch keine Freunde vorhanden.</q-banner>
      </section>

      <section class="glass-card q-pa-md">
        <div class="text-subtitle1 text-weight-bold">Eingehende Anfragen</div>
        <q-list bordered separator class="rounded-borders q-mt-sm" v-if="dbStore.offeneFreundschaftsanfragen.length">
          <q-item v-for="item in dbStore.offeneFreundschaftsanfragen" :key="item.id">
            <q-item-section>
              <q-item-label>{{ item.absender_name }}</q-item-label>
              <q-item-label caption>möchte dein Freund sein</q-item-label>
            </q-item-section>
            <q-item-section side class="row q-gutter-xs">
              <q-btn dense round color="primary" icon="check" @click="annehmen(item)" />
              <q-btn dense round color="negative" icon="close" @click="ablehnen(item)" />
            </q-item-section>
          </q-item>
        </q-list>
        <q-banner v-else class="state-box q-mt-sm">Keine offenen Anfragen.</q-banner>

        <div class="text-subtitle1 text-weight-bold q-mt-lg">Gesendete Anfragen</div>
        <q-list bordered separator class="rounded-borders q-mt-sm" v-if="dbStore.gesendeteFreundschaftsanfragen.length">
          <q-item v-for="item in dbStore.gesendeteFreundschaftsanfragen" :key="item.id">
            <q-item-section>
              <q-item-label>{{ item.empfaenger_name }}</q-item-label>
              <q-item-label caption>wartet auf Antwort</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-banner v-else class="state-box q-mt-sm">Keine gesendeten Anfragen.</q-banner>
      </section>

      <section class="glass-card q-pa-md">
        <div class="text-subtitle1 text-weight-bold">Personen finden</div>
        <q-input v-model="suchtext" outlined dense clearable label="Suche nach Name oder E-Mail" class="q-mt-sm" />

        <q-list bordered separator class="rounded-borders q-mt-sm" v-if="vorschlaege.length">
          <q-item v-for="person in vorschlaege" :key="person.id">
            <q-item-section>
              <q-item-label>{{ fullName(person) }}</q-item-label>
              <q-item-label caption>{{ person.email }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn dense color="primary" icon="person_add" label="Anfragen" no-caps unelevated @click="sendeAnfrage(person)" />
            </q-item-section>
          </q-item>
        </q-list>
        <q-banner v-else class="state-box q-mt-sm">Keine Personen verfügbar.</q-banner>
      </section>
    </div>
  </q-page>
</template>

<style scoped>
.friends-layout {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .friends-layout {
    grid-template-columns: 1fr;
  }
}
</style>

