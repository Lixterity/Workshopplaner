<script setup>
import { computed, onMounted } from 'vue';

import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();

const cards = computed(() =>
  dbStore.meineEvents.map((event) => ({
    ...event,
    workshopCount: dbStore.workshops.filter((w) => w.event_id === event.id).length,
    friendCount: dbStore.friendCountForEvent(event.id),
  })),
);

onMounted(async () => {
  await dbStore.refreshAll();
});
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="q-mb-md">
        <h1 class="page-title">Meine Events</h1>
        <p class="page-subtitle">Events, in denen du mindestens einen Workshop gebucht hast.</p>
      </div>

      <div class="event-grid">
        <q-card v-for="event in cards" :key="event.id" class="glass-card event-card q-pa-md">
          <div class="row items-center justify-between">
            <div class="text-h6 text-weight-bold">{{ event.name }}</div>
            <q-chip dense icon="group" color="primary" text-color="white">{{ event.friendCount }} Freunde</q-chip>
          </div>

          <div class="text-caption text-grey-7 q-mt-xs">{{ event.workshopCount }} gebuchte Workshops</div>

          <div class="q-mt-md">
            <q-btn :to="`/veranstaltungen/${event.id}/workshops`" color="primary" icon="list" label="Workshops im Event" no-caps unelevated />
          </div>
        </q-card>
      </div>

      <q-banner v-if="!cards.length" class="glass-card q-pa-md">Du nimmst aktuell an keinem Event teil.</q-banner>
    </div>
  </q-page>
</template>

<style scoped>
.event-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.event-card {
  border-radius: 18px;
}
</style>
