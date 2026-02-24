<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from '../stores/dbStore';

const router = useRouter();
const dbStore = useDbStore();
const $q = useQuasar();

const meineRegistriertenWorkshops = computed(() => dbStore.meineWorkshops);

const meineOrganisatorWorkshops = computed(() => {
  if (!dbStore.istOrganisator && !dbStore.istAdmin) return [];
  return dbStore.workshops.filter((item) => dbStore.canEditWorkshop(item));
});

const dayGroups = computed(() => {
  const groups = new Map();

  for (const workshop of meineRegistriertenWorkshops.value) {
    const date = workshop.anfang_datum_zeit ? new Date(workshop.anfang_datum_zeit) : null;
    const isValid = date && !Number.isNaN(date.getTime());

    const key = isValid ? date.toISOString().slice(0, 10) : 'no-date';
    const label = isValid
      ? new Intl.DateTimeFormat('de-AT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
      : 'Datum offen';

    if (!groups.has(key)) {
      groups.set(key, { key, label, workshops: [] });
    }
    groups.get(key).workshops.push(workshop);
  }

  const sorted = [...groups.values()].sort((a, b) => {
    if (a.key === 'no-date') return 1;
    if (b.key === 'no-date') return -1;
    return a.key.localeCompare(b.key);
  });

  return sorted;
});

function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('de-AT', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function eventName(eventId) {
  return dbStore.getEventById(eventId)?.name || `Event #${eventId}`;
}

function capacityRatio(workshop) {
  if (!workshop.kapazitaet) return 0;
  return Math.min(dbStore.workshopBelegung(workshop.id) / workshop.kapazitaet, 1);
}

function capacityColor(workshop) {
  const ratio = capacityRatio(workshop);
  if (ratio >= 0.9) return 'negative';
  if (ratio >= 0.6) return 'warning';
  return 'primary';
}

async function abmelden(workshopId) {
  const { error } = await dbStore.workshopAbmelden(workshopId);
  if (error) {
    $q.notify({ type: 'negative', message: error.message, multiLine: true, classes: 'notify-compact' });
    return;
  }
  $q.notify({ type: 'positive', message: 'Abmeldung erfolgreich.' });
}

</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-end justify-between q-mb-lg">
        <div>
          <h1 class="page-title">Meine Workshops</h1>
          <p class="page-subtitle">Dein persoenlicher Stundenplan.</p>
        </div>
        <q-chip v-if="meineRegistriertenWorkshops.length" outline color="primary" icon="event_note">
          {{ meineRegistriertenWorkshops.length }} Workshop{{ meineRegistriertenWorkshops.length !== 1 ? 's' : '' }}
        </q-chip>
      </div>

      <div v-if="dayGroups.length" class="schedule">
        <div v-for="group in dayGroups" :key="group.key" class="schedule-day">
          <div class="day-header">
            <div class="day-header__line" />
            <span class="day-header__label">{{ group.label }}</span>
            <div class="day-header__line" />
          </div>

          <div class="day-cards">
            <div
              v-for="workshop in group.workshops"
              :key="workshop.id"
              class="schedule-card glass-card cursor-pointer"
              @click="router.push(`/workshops/${workshop.id}`)"
            >
              <div class="schedule-card__time">
                <div class="time-start">{{ formatTime(workshop.anfang_datum_zeit) }}</div>
                <div class="time-divider" />
                <div class="time-end">{{ formatTime(workshop.ende_datum_zeit) }}</div>
              </div>

              <div class="schedule-card__body">
                <div class="schedule-card__top">
                  <div class="schedule-card__event text-caption text-primary text-weight-bold">{{ eventName(workshop.event_id) }}</div>
                  <div class="schedule-card__title text-weight-bold">{{ workshop.titel }}</div>
                  <div class="schedule-card__desc text-caption" v-if="workshop.beschreibung">{{ workshop.beschreibung }}</div>
                </div>

                <div class="schedule-card__meta">
                  <span class="meta-item">
                    <q-icon name="meeting_room" size="16px" color="primary" />
                    {{ workshop.raum || 'Raum offen' }}
                  </span>
                  <span class="meta-item">
                    <q-icon name="groups" size="16px" color="primary" />
                    {{ dbStore.workshopBelegung(workshop.id) }} / {{ workshop.kapazitaet ?? '\u221E' }}
                  </span>
                  <span class="meta-item" v-if="workshop.kosten">
                    <q-icon name="payments" size="16px" color="primary" />
                    {{ workshop.kosten }} EUR
                  </span>
                  <span class="meta-item" v-if="dbStore.friendCountForWorkshop(workshop.id)">
                    <q-icon name="group" size="16px" color="primary" />
                    {{ dbStore.friendCountForWorkshop(workshop.id) }} Freunde
                  </span>
                </div>

                <q-linear-progress
                  v-if="workshop.kapazitaet"
                  :value="capacityRatio(workshop)"
                  :color="capacityColor(workshop)"
                  track-color="grey-3"
                  rounded
                  size="6px"
                  class="capacity-bar"
                />

                <div class="schedule-card__bottom">
                  <div class="friend-avatars" v-if="dbStore.friendsInWorkshop(workshop.id).length">
                    <q-avatar
                      v-for="friend in dbStore.friendsInWorkshop(workshop.id).slice(0, 4)"
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
                      v-if="dbStore.friendsInWorkshop(workshop.id).length > 4"
                      size="26px"
                      color="grey-6"
                      text-color="white"
                      class="friend-avatar"
                    >
                      +{{ dbStore.friendsInWorkshop(workshop.id).length - 4 }}
                    </q-avatar>
                  </div>
                  <div class="schedule-card__actions">
                    <q-btn :to="`/workshops/${workshop.id}`" flat color="primary" icon="open_in_new" label="Details" dense no-caps @click.stop />
                    <q-btn color="negative" icon="event_busy" label="Abmelden" dense no-caps unelevated @click.stop="abmelden(workshop.id)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <q-banner v-else class="glass-card q-pa-lg text-center">
        <q-icon name="event_busy" size="48px" color="grey-5" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-bold">Noch keine Anmeldungen</div>
        <div class="text-caption text-grey-7 q-mt-xs">Melde dich bei Workshops an, um deinen Stundenplan zu fuellen.</div>
        <q-btn class="q-mt-md" color="primary" icon="view_list" label="Workshops entdecken" no-caps unelevated to="/workshops" />
      </q-banner>

      <template v-if="(dbStore.istOrganisator || dbStore.istAdmin) && meineOrganisatorWorkshops.length">
        <q-separator class="q-my-lg" />
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Meine erstellten Workshops</div>
        <div class="org-grid">
          <q-card
            v-for="workshop in meineOrganisatorWorkshops"
            :key="workshop.id"
            class="glass-card q-pa-md cursor-pointer"
            @click="router.push(`/workshops/${workshop.id}`)"
          >
            <div class="text-caption text-primary text-weight-bold">{{ eventName(workshop.event_id) }}</div>
            <div class="text-subtitle1 text-weight-bold">{{ workshop.titel }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ formatTime(workshop.anfang_datum_zeit) }} - {{ formatTime(workshop.ende_datum_zeit) }}
              <span class="q-mx-xs">|</span>
              {{ dbStore.workshopBelegung(workshop.id) }} / {{ workshop.kapazitaet ?? '\u221E' }} Teilnehmer
            </div>
          </q-card>
        </div>
      </template>
    </div>
  </q-page>
</template>

<style scoped>
.schedule {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-day {
  margin-bottom: 8px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.day-header__line {
  flex: 1;
  height: 1px;
  background: var(--wp-border-light);
}

body.body--dark .day-header__line {
  background: var(--wp-border-dark);
}

.day-header__label {
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--wp-text-muted-light);
  white-space: nowrap;
}

body.body--dark .day-header__label {
  color: var(--wp-text-muted-dark);
}

.day-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-card {
  display: flex;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.schedule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(208, 122, 40, 0.18);
}

body.body--dark .schedule-card:hover {
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.5);
}

.schedule-card__time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 90px;
  padding: 18px 14px;
  background: linear-gradient(145deg, var(--wp-orange), var(--wp-accent));
  color: #2b1a08;
}

body.body--dark .schedule-card__time {
  background: linear-gradient(145deg, var(--wp-primary-dark-strong), var(--wp-primary-dark));
  color: #1b1208;
}

.time-start,
.time-end {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.time-divider {
  width: 20px;
  height: 2px;
  background: rgba(43, 26, 8, 0.3);
  border-radius: 1px;
}

.schedule-card__body {
  flex: 1;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.schedule-card__top {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-card__event {
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.schedule-card__title {
  font-size: 1.08rem;
  line-height: 1.25;
  word-break: break-word;
}

.schedule-card__desc {
  color: var(--wp-text-muted-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

body.body--dark .schedule-card__desc {
  color: var(--wp-text-muted-dark);
}

.schedule-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--wp-text-muted-light);
}

body.body--dark .meta-item {
  color: var(--wp-text-muted-dark);
}

.capacity-bar {
  max-width: 200px;
}

.schedule-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}

.schedule-card__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
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

body.body--dark .friend-avatar {
  outline-color: #0f1620;
}

.org-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

@media (max-width: 600px) {
  .schedule-card {
    flex-direction: column;
  }

  .schedule-card__time {
    flex-direction: row;
    min-width: unset;
    padding: 10px 16px;
    gap: 8px;
  }

  .time-divider {
    width: 2px;
    height: 16px;
  }

  .capacity-bar {
    max-width: 100%;
  }
}
</style>
