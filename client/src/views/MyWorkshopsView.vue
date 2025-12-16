<script setup>
import { computed, onMounted, toRaw } from 'vue';
import { useQuasar } from 'quasar';
import { useDbStore } from '../stores/dbStore';

const $q = useQuasar();
const dbStore = useDbStore();

onMounted(() => {
  dbStore.fetchWorkshops();
  console.log(dbStore.user);
});

const userName = toRaw(dbStore.user.identities[0].identity_data.first_name);
const isDark = computed(() => $q.dark.isActive);

const dayStartHour = 8;
const dayEndHour = 17;
const totalMinutes = (dayEndHour - dayStartHour) * 60;

const weekDays = [
  { id: '2025-06-23', short: 'Mo', fullDate: '23.6.', label: 'Montag, 23. Juni' },
  { id: '2025-06-24', short: 'Di', fullDate: '24.6.', label: 'Dienstag, 24. Juni' },
  { id: '2025-06-25', short: 'Mi', fullDate: '25.6.', label: 'Mittwoch, 25. Juni' },
  { id: '2025-06-26', short: 'Do', fullDate: '26.6.', label: 'Donnerstag, 26. Juni' },
];

const timeLabels = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const workshopsForDay = (dayId) => dbStore.workshops.filter((workshop) => workshop.dayId === dayId);

const getEventStyle = (workshop) => {
  const startMinutes = parseTimeToMinutes(workshop.start);
  const endMinutes = parseTimeToMinutes(workshop.end);
  const offset = startMinutes - dayStartHour * 60;
  const heightMinutes = endMinutes - startMinutes;

  return {
    top: `${(offset / totalMinutes) * 100}%`,
    height: `${Math.max((heightMinutes / totalMinutes) * 100, 15)}%`,
    background: `linear-gradient(180deg, ${workshop.color}, ${workshop.color}cc)`,
    color: '#0f172a',
  };
};
</script>

<template>
  <q-page class="my-workshops q-pa-lg" :class="{ 'my-workshops--dark': isDark }">
    <div class="page-heading">
      <div>
        <div class="text-overline text-primary text-weight-bold">Hallo {{ userName }}</div>
        <div class="text-h4 text-weight-bold">Mein Programm</div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          KW 25 - 23.-26. Juni 2025 - Keine Ueberschneidungen
        </div>
      </div>
      <q-chip outline color="primary" text-color="primary" icon="event_available" class="q-mt-sm">
        3 Workshops bestätigt
      </q-chip>
    </div>

    <q-card class="calendar-card q-mt-xl" :class="isDark ? 'calendar-dark' : 'calendar-light'">
      <div class="calendar-header row no-wrap">
        <div class="time-placeholder"></div>
        <div v-for="day in weekDays" :key="day.id" class="calendar-day text-center">
          <div class="text-subtitle2 text-weight-bold">{{ day.short }}</div>
          <div class="text-caption text-grey-6">{{ day.fullDate }}</div>
        </div>
      </div>

      <div class="calendar-body">
        <div class="time-column">
          <div v-for="label in timeLabels" :key="label" class="time-slot text-caption">
            {{ label }}
          </div>
        </div>

        <div class="columns-wrapper">
          <div v-for="day in weekDays" :key="day.id" class="calendar-column">
            <div class="grid-lines">
              <span
                v-for="(label, index) in timeLabels"
                :key="`${day.id}-${label}`"
                :class="['grid-line', { 'grid-line--bold': index === 0 }]"
              />
            </div>
            <div
              v-for="workshop in dbStore.workshops.filter((w) => w.dayId === day.id)"
              :key="workshop.id"
              class="calendar-event"
              :style="getEventStyle(workshop.titel)"
            >
              <div class="text-body1 text-weight-bold">{{ workshop.titel }}</div>
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ workshop.anfang_datum_zeit }}-{{ workshop.ende_datum_zeit }} |
                {{ workshop.location }}
              </div>
              <div class="text-caption text-grey-9 q-mt-xs">{{ workshop.beschreibung }}</div>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<style scoped>
.my-workshops {
  min-height: calc(100vh - 98px);
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.my-workshops--dark {
  background: radial-gradient(circle at top, rgba(59, 130, 246, 0.15), #0f172a 75%);
}

.my-workshops :deep(.q-banner) {
  border-radius: 18px;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.confirmation-banner {
  border: 1px solid rgba(76, 175, 80, 0.25);
}

.banner-light {
  background-color: #e8f5e9;
}

.banner-dark {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.4);
  color: #d1fae5;
}

.calendar-card {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.calendar-light {
  background-color: #ffffff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.calendar-dark {
  background: rgba(15, 23, 42, 0.95);
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.calendar-header {
  padding: 24px 28px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.time-placeholder {
  width: 60px;
}

.calendar-day {
  flex: 1;
}

.calendar-body {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 12px;
  padding: 24px;
}

.time-column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 4px;
}

.time-slot {
  height: 56px;
  color: #64748b;
}

.my-workshops--dark .time-slot {
  color: #cbd5f5;
}

.columns-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.calendar-column {
  position: relative;
  height: 504px;
  border-left: 1px solid rgba(148, 163, 184, 0.3);
  border-right: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background-color: rgba(148, 163, 184, 0.08);
  padding: 0 12px;
  overflow: hidden;
}

.my-workshops--dark .calendar-column {
  background-color: rgba(148, 163, 184, 0.18);
  border-color: rgba(148, 163, 184, 0.35);
}

.grid-lines {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  display: block;
  width: 100%;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
  flex-grow: 1;
}

.grid-line--bold {
  border-color: rgba(15, 23, 42, 0.25);
}

.my-workshops--dark .grid-line {
  border-color: rgba(148, 163, 184, 0.35);
}

.my-workshops--dark .grid-line--bold {
  border-color: rgba(226, 232, 240, 0.5);
}

.calendar-event {
  position: absolute;
  left: 12px;
  right: 12px;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
}

@media (max-width: 900px) {
  .calendar-body {
    grid-template-columns: 1fr;
  }

  .time-placeholder,
  .time-column {
    display: none;
  }

  .calendar-header {
    grid-template-columns: repeat(4, 1fr);
    overflow-x: auto;
  }

  .columns-wrapper {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}
</style>
