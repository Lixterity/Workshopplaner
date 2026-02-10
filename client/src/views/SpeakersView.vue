<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const suchtext = ref('');
const workshopZiel = ref(null);

const orgDialog = ref(false);
const orgSaving = ref(false);
const orgForm = ref({
  id: null,
  vorname: '',
  nachname: '',
  email: '',
});

const workshopOptionen = computed(() =>
  dbStore.workshops.map((workshop) => ({
    label: workshop.titel,
    value: workshop.id,
  })),
);

const organisatorenListe = computed(() => {
  const text = suchtext.value.trim().toLowerCase();
  return dbStore.organisatoren.filter((person) => {
    if (!text) return true;
    const name = `${person.vorname} ${person.nachname}`.toLowerCase();
    return name.includes(text) || (person.email || '').toLowerCase().includes(text);
  });
});

const moeglicheNeueOrganisatoren = computed(() =>
  dbStore.teilnehmer.filter((person) => person.rollen_name !== dbStore.ROLLEN.ORGANISATOR),
);

function fullName(person) {
  return `${person.vorname} ${person.nachname}`.trim();
}

function openNew() {
  orgForm.value = { id: null, vorname: '', nachname: '', email: '' };
  orgDialog.value = true;
}

function openEdit(person) {
  orgForm.value = {
    id: person.id,
    vorname: person.vorname,
    nachname: person.nachname,
    email: person.email,
  };
  orgDialog.value = true;
}

async function saveOrganisator() {
  if (!orgForm.value.vorname || !orgForm.value.nachname || !orgForm.value.email) {
    $q.notify({ type: 'warning', message: 'Bitte alle Felder ausfüllen.' });
    return;
  }

  orgSaving.value = true;
  let result;

  if (orgForm.value.id) {
    result = await dbStore.updateTeilnehmer(orgForm.value.id, orgForm.value);
    if (!result.error) {
      result = await dbStore.setUserRole(orgForm.value.id, dbStore.ROLLEN.ORGANISATOR);
    }
  } else {
    result = await dbStore.createTeilnehmer({ ...orgForm.value, rollen_name: dbStore.ROLLEN.ORGANISATOR });
  }

  orgSaving.value = false;

  if (result.error) {
    $q.notify({ type: 'negative', message: `Speichern fehlgeschlagen: ${result.error.message}` });
    return;
  }

  orgDialog.value = false;
  await dbStore.fetchTeilnehmer();
  $q.notify({ type: 'positive', message: 'Organisator gespeichert.' });
}

async function setzeAlsOrganisator(person) {
  const { error } = await dbStore.setUserRole(person.id, dbStore.ROLLEN.ORGANISATOR);
  if (error) {
    $q.notify({ type: 'negative', message: `Rolle konnte nicht gesetzt werden: ${error.message}` });
    return;
  }
  $q.notify({ type: 'positive', message: `${fullName(person)} ist jetzt Organisator.` });
}

async function removeOrganisator(person) {
  const { error } = await dbStore.setUserRole(person.id, dbStore.ROLLEN.TEILNEHMER);
  if (error) {
    $q.notify({ type: 'negative', message: `Rolle konnte nicht entfernt werden: ${error.message}` });
    return;
  }
  $q.notify({ type: 'positive', message: `${fullName(person)} wurde auf TEILNEHMER gestellt.` });
}

function einladen(person) {
  const workshop = dbStore.getWorkshopById(workshopZiel.value);
  if (!workshop) {
    $q.notify({ type: 'warning', message: 'Bitte zuerst einen Workshop wählen.' });
    return;
  }
  $q.notify({
    type: 'positive',
    message: `${fullName(person)} wurde zur Organisation von "${workshop.titel}" eingeladen (Frontend-Demo).`,
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
        <div class="col-12 col-md-8">
          <h1 class="page-title">Liste der Organisatoren</h1>
          <p class="page-subtitle">Einladungen für Workshops und CRUD auf Organisator-Ebene.</p>
        </div>
        <div class="col-12 col-md-auto" v-if="dbStore.istAdmin">
          <q-btn color="primary" icon="add" label="Organisator erstellen" no-caps unelevated @click="openNew" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <q-input v-model="suchtext" outlined dense clearable label="Organisator suchen">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-6">
          <q-select
            v-model="workshopZiel"
            outlined
            dense
            emit-value
            map-options
            :options="workshopOptionen"
            label="Workshop für Einladung"
          />
        </div>
      </div>

      <div class="organisator-grid">
        <q-card v-for="person in organisatorenListe" :key="person.id" class="glass-card q-pa-md">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">{{ fullName(person) }}</div>
              <div class="text-caption text-grey-7">{{ person.email }}</div>
            </div>
            <q-chip dense color="primary" text-color="white">ORGANISATOR</q-chip>
          </div>

          <div class="row q-gutter-sm q-mt-md">
            <q-btn color="primary" icon="mail" label="Einladen" no-caps unelevated @click="einladen(person)" />
            <q-btn v-if="dbStore.istAdmin" flat color="primary" icon="edit" label="Bearbeiten" no-caps @click="openEdit(person)" />
            <q-btn v-if="dbStore.istAdmin" flat color="negative" icon="person_off" label="Entziehen" no-caps @click="removeOrganisator(person)" />
          </div>
        </q-card>
      </div>

      <q-card v-if="dbStore.istAdmin" class="glass-card q-pa-md q-mt-md">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Weitere Personen als Organisator setzen</div>
        <q-list bordered separator class="rounded-borders" v-if="moeglicheNeueOrganisatoren.length">
          <q-item v-for="person in moeglicheNeueOrganisatoren" :key="person.id">
            <q-item-section>
              <q-item-label>{{ fullName(person) }}</q-item-label>
              <q-item-label caption>{{ person.email }} | {{ person.rollen_name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn color="primary" icon="upgrade" label="Zu Organisator" no-caps unelevated @click="setzeAlsOrganisator(person)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-banner v-if="!organisatorenListe.length" class="glass-card q-pa-md q-mt-md">Keine Organisatoren gefunden.</q-banner>
    </div>

    <q-dialog v-model="orgDialog">
      <q-card class="glass-card" style="width: min(560px, 92vw)">
        <q-card-section>
          <div class="text-h6">{{ orgForm.id ? 'Organisator bearbeiten' : 'Organisator erstellen' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="orgForm.vorname" outlined dense label="Vorname" />
          <q-input v-model="orgForm.nachname" outlined dense label="Nachname" />
          <q-input v-model="orgForm.email" outlined dense type="email" label="E-Mail" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" no-caps v-close-popup />
          <q-btn color="primary" :loading="orgSaving" label="Speichern" no-caps unelevated @click="saveOrganisator" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.organisator-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style>
