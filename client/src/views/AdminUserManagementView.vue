<script setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();
const $q = useQuasar();

const suchtext = ref('');
const userDialog = ref(false);
const userSaving = ref(false);

const userForm = ref({
  id: null,
  vorname: '',
  nachname: '',
  email: '',
  rollen_name: dbStore.ROLLEN.TEILNEHMER,
});

const rollenOptionen = computed(() => [
  { label: 'TEILNEHMER', value: dbStore.ROLLEN.TEILNEHMER },
  { label: 'ORGANISATOR', value: dbStore.ROLLEN.ORGANISATOR },
  { label: 'ADMINISTRATOR', value: dbStore.ROLLEN.ADMINISTRATOR },
]);

const rows = computed(() => {
  const text = suchtext.value.trim().toLowerCase();
  return dbStore.teilnehmer.filter((person) => {
    if (!text) return true;
    const name = `${person.vorname} ${person.nachname}`.toLowerCase();
    return (
      name.includes(text) ||
      (person.email || '').toLowerCase().includes(text) ||
      (person.rollen_name || '').toLowerCase().includes(text)
    );
  });
});

const columns = [
  { name: 'name', label: 'Name', field: (row) => `${row.vorname} ${row.nachname}`, sortable: true, align: 'left' },
  { name: 'email', label: 'E-Mail', field: 'email', sortable: true, align: 'left' },
  { name: 'rolle', label: 'Rolle', field: 'rollen_name', sortable: true, align: 'left' },
  { name: 'aktion', label: 'Aktionen', field: 'aktion', align: 'right' },
];

function openCreate() {
  userForm.value = {
    id: null,
    vorname: '',
    nachname: '',
    email: '',
    rollen_name: dbStore.ROLLEN.TEILNEHMER,
  };
  userDialog.value = true;
}

function openEdit(row) {
  userForm.value = {
    id: row.id,
    vorname: row.vorname,
    nachname: row.nachname,
    email: row.email,
    rollen_name: row.rollen_name,
  };
  userDialog.value = true;
}

async function saveUser() {
  if (!userForm.value.vorname || !userForm.value.nachname || !userForm.value.email) {
    $q.notify({ type: 'warning', message: 'Bitte alle Felder ausfüllen.' });
    return;
  }

  userSaving.value = true;

  let result;
  if (userForm.value.id) {
    result = await dbStore.updateTeilnehmer(userForm.value.id, userForm.value);
    if (!result.error) {
      result = await dbStore.setUserRole(userForm.value.id, userForm.value.rollen_name);
    }
  } else {
    result = await dbStore.createTeilnehmer(userForm.value);
    if (!result.error && result.data?.id) {
      result = await dbStore.setUserRole(result.data.id, userForm.value.rollen_name);
    }
  }

  userSaving.value = false;

  if (result.error) {
    $q.notify({ type: 'negative', message: `Speichern fehlgeschlagen: ${result.error.message}` });
    return;
  }

  userDialog.value = false;
  await dbStore.fetchTeilnehmer();
  $q.notify({ type: 'positive', message: 'Benutzer gespeichert.' });
}

async function loeschen(row) {
  $q.dialog({ title: 'Benutzer löschen', message: `${row.vorname} ${row.nachname} wirklich löschen?`, cancel: true, persistent: true }).onOk(
    async () => {
      const { error } = await dbStore.deleteTeilnehmer(row.id);
      if (error) {
        $q.notify({ type: 'negative', message: `Löschen fehlgeschlagen: ${error.message}` });
        return;
      }
      $q.notify({ type: 'positive', message: 'Benutzer gelöscht.' });
    },
  );
}

</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <h1 class="page-title">Administration - Benutzer und Rollen</h1>
          <p class="page-subtitle">CRUD für Benutzer und direkte Rollenvergabe.</p>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn color="primary" icon="person_add" label="Benutzer erstellen" no-caps unelevated @click="openCreate" />
        </div>
      </div>

      <q-input v-model="suchtext" outlined dense clearable label="Suchen" class="q-mb-md">
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-table
        class="glass-card"
        :rows="rows"
        :columns="columns"
        row-key="id"
        flat
        :rows-per-page-options="[10, 25, 50, 0]"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-rolle="props">
          <q-td :props="props">
            <q-chip dense color="primary" text-color="white">{{ props.row.rollen_name }}</q-chip>
          </q-td>
        </template>

        <template #body-cell-aktion="props">
          <q-td :props="props" class="text-right">
            <q-btn dense flat round icon="edit" color="primary" @click="openEdit(props.row)" />
            <q-btn dense flat round icon="delete" color="negative" @click="loeschen(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="userDialog">
      <q-card class="glass-card" style="width: min(560px, 92vw)">
        <q-card-section>
          <div class="text-h6">{{ userForm.id ? 'Benutzer bearbeiten' : 'Benutzer erstellen' }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="userForm.vorname" outlined dense label="Vorname" />
          <q-input v-model="userForm.nachname" outlined dense label="Nachname" />
          <q-input v-model="userForm.email" type="email" outlined dense label="E-Mail" />
          <q-select
            v-model="userForm.rollen_name"
            outlined
            dense
            emit-value
            map-options
            :options="rollenOptionen"
            label="Rolle"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" no-caps v-close-popup />
          <q-btn color="primary" :loading="userSaving" label="Speichern" no-caps unelevated @click="saveUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
