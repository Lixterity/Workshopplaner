<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";

import { useDbStore } from "../stores/dbStore";

const dbStore = useDbStore();
const $q = useQuasar();

const selectedEventId = ref(null);

onMounted(async () => {
  const { error } = await dbStore.fetchStatistiken();
  if (error) {
    $q.notify({
      type: "negative",
      message: `Statistiken konnten nicht geladen werden: ${error.message}`,
    });
  }
});

function toNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function percent(value, total) {
  const current = toNumber(value);
  const max = toNumber(total);
  if (!max) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

function formatDate(value) {
  if (!value) return "Kein Datum";
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const eventOptions = computed(() => [
  { label: "Alle Events", value: null },
  ...dbStore.eventStatistik.map((event) => ({
    label: event.event_name,
    value: event.event_id,
  })),
]);

const workshopRows = computed(() => {
  const rows = dbStore.beliebtesteWorkshops;
  if (!selectedEventId.value) return rows;
  const event = dbStore.eventStatistik.find(
    (item) => item.event_id === selectedEventId.value,
  );
  if (!event) return rows;
  return rows.filter((row) => row.event_name === event.event_name);
});

const topWorkshops = computed(() =>
  [...workshopRows.value]
    .sort((a, b) => {
      const registrations =
        toNumber(b.anzahl_anmeldungen) - toNumber(a.anzahl_anmeldungen);
      if (registrations !== 0) return registrations;
      return (
        percent(b.anzahl_anmeldungen, b.kapazitaet) -
        percent(a.anzahl_anmeldungen, a.kapazitaet)
      );
    })
    .slice(0, 8),
);

const maxWorkshopRegistrations = computed(() =>
  Math.max(
    1,
    ...topWorkshops.value.map((row) => toNumber(row.anzahl_anmeldungen)),
  ),
);

const dailyRows = computed(() => dbStore.anmeldungenProTag);

const maxDailyRegistrations = computed(() =>
  Math.max(
    1,
    ...dailyRows.value.map((row) => toNumber(row.anzahl_anmeldungen)),
  ),
);

const hourlyRows = computed(() => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    count: 0,
  }));

  for (const registration of dbStore.registrierungen) {
    if (!registration.erstellt_am) continue;
    const date = new Date(registration.erstellt_am);
    if (Number.isNaN(date.getTime())) continue;
    buckets[date.getHours()].count += 1;
  }

  return buckets;
});

const activeHourlyRows = computed(() =>
  hourlyRows.value.filter((row) => row.count > 0),
);

const maxHourlyRegistrations = computed(() =>
  Math.max(1, ...hourlyRows.value.map((row) => row.count)),
);

const totalRegistrations = computed(() =>
  dbStore.beliebtesteWorkshops.reduce(
    (sum, row) => sum + toNumber(row.anzahl_anmeldungen),
    0,
  ),
);

const totalWorkshops = computed(() => dbStore.beliebtesteWorkshops.length);

const averageOccupancy = computed(() => {
  const workshopsWithCapacity = dbStore.beliebtesteWorkshops.filter(
    (row) => toNumber(row.kapazitaet) > 0,
  );
  if (!workshopsWithCapacity.length) return 0;
  const total = workshopsWithCapacity.reduce(
    (sum, row) => sum + percent(row.anzahl_anmeldungen, row.kapazitaet),
    0,
  );
  return Math.round(total / workshopsWithCapacity.length);
});

const busiestWorkshop = computed(() => topWorkshops.value[0] ?? null);

const strongestDay = computed(
  () =>
    [...dailyRows.value].sort(
      (a, b) => toNumber(b.anzahl_anmeldungen) - toNumber(a.anzahl_anmeldungen),
    )[0] ?? null,
);

const strongestHour = computed(
  () => [...hourlyRows.value].sort((a, b) => b.count - a.count)[0] ?? null,
);

const eventRows = computed(() => dbStore.eventStatistik.slice(0, 6));
const maxEventRegistrations = computed(() =>
  Math.max(
    1,
    ...eventRows.value.map((row) => toNumber(row.anzahl_anmeldungen)),
  ),
);

const tagRows = computed(() => dbStore.tagStatistik.slice(0, 6));
const maxTagWorkshops = computed(() =>
  Math.max(1, ...tagRows.value.map((row) => toNumber(row.anzahl_workshops))),
);
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max">
      <div class="row items-start justify-between q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-7">
          <h1 class="page-title">Statistik</h1>
          <p class="page-subtitle">
            Reporting zu Workshop-Auslastung und Anmeldezeiten.
          </p>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedEventId"
            :options="eventOptions"
            outlined
            dense
            emit-value
            map-options
            label="Event filtern"
          />
        </div>
      </div>

      <div class="metric-grid q-mb-md">
        <section class="glass-card q-pa-md metric-box">
          <q-icon name="groups" color="primary" size="24px" />
          <div>
            <div class="metric-value">{{ totalRegistrations }}</div>
            <div class="metric-label">Anmeldungen gesamt</div>
          </div>
        </section>
        <section class="glass-card q-pa-md metric-box">
          <q-icon name="view_list" color="primary" size="24px" />
          <div>
            <div class="metric-value">{{ totalWorkshops }}</div>
            <div class="metric-label">Workshops im Bericht</div>
          </div>
        </section>
        <section class="glass-card q-pa-md metric-box">
          <q-icon name="donut_large" color="primary" size="24px" />
          <div>
            <div class="metric-value">{{ averageOccupancy }}%</div>
            <div class="metric-label">Durchschnittliche Auslastung</div>
          </div>
        </section>
        <section class="glass-card q-pa-md metric-box">
          <q-icon name="schedule" color="primary" size="24px" />
          <div>
            <div class="metric-value">{{ strongestHour?.label ?? "-" }}</div>
            <div class="metric-label">Stärkste Anmeldezeit</div>
          </div>
        </section>
      </div>

      <div class="report-grid">
        <section class="glass-card q-pa-md">
          <div class="section-header">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Stark frequentierte Workshops
              </div>
              <div class="text-caption text-grey-7">
                {{
                  busiestWorkshop
                    ? `${busiestWorkshop.titel} führt aktuell.`
                    : "Keine Daten vorhanden."
                }}
              </div>
            </div>
            <q-btn
              flat
              dense
              round
              icon="refresh"
              :loading="dbStore.statistikLoading"
              @click="dbStore.fetchStatistiken"
            />
          </div>

          <div v-if="topWorkshops.length" class="bar-list q-mt-md">
            <div
              v-for="workshop in topWorkshops"
              :key="workshop.workshop_id"
              class="bar-row"
            >
              <div class="bar-row__top">
                <span class="bar-title">{{ workshop.titel }}</span>
                <span class="bar-value">
                  {{ toNumber(workshop.anzahl_anmeldungen) }} /
                  {{ workshop.kapazitaet ?? "-" }}
                </span>
              </div>
              <div class="bar-row__meta">
                <span>{{ workshop.event_name }}</span>
                <span
                  >{{
                    percent(workshop.anzahl_anmeldungen, workshop.kapazitaet)
                  }}% Auslastung</span
                >
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${Math.max(3, (toNumber(workshop.anzahl_anmeldungen) / maxWorkshopRegistrations) * 100)}%`,
                  }"
                />
              </div>
            </div>
          </div>
          <q-banner v-else class="state-box q-mt-md"
            >Keine Workshop-Statistiken verfügbar.</q-banner
          >
        </section>

        <section class="glass-card q-pa-md">
          <div class="section-header">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Anmeldungen nach Tag
              </div>
              <div class="text-caption text-grey-7">
                {{
                  strongestDay
                    ? `${formatDate(strongestDay.datum)} mit ${toNumber(strongestDay.anzahl_anmeldungen)} Anmeldungen.`
                    : "Keine Tagesdaten vorhanden."
                }}
              </div>
            </div>
          </div>

          <div v-if="dailyRows.length" class="timeline q-mt-md">
            <div v-for="row in dailyRows" :key="row.datum" class="timeline-row">
              <div class="timeline-label">{{ formatDate(row.datum) }}</div>
              <div class="timeline-track">
                <div
                  class="timeline-fill"
                  :style="{
                    width: `${Math.max(4, (toNumber(row.anzahl_anmeldungen) / maxDailyRegistrations) * 100)}%`,
                  }"
                />
              </div>
              <div class="timeline-value">
                {{ toNumber(row.anzahl_anmeldungen) }}
              </div>
            </div>
          </div>
          <q-banner v-else class="state-box q-mt-md"
            >Keine Anmeldungen pro Tag verfügbar.</q-banner
          >
        </section>

        <section class="glass-card q-pa-md">
          <div class="text-subtitle1 text-weight-bold">
            Anmeldungen nach Uhrzeit
          </div>
          <div class="text-caption text-grey-7">
            {{
              strongestHour?.count
                ? `${strongestHour.label} mit ${strongestHour.count} Anmeldungen.`
                : "Keine Uhrzeitdaten vorhanden."
            }}
          </div>

          <div v-if="activeHourlyRows.length" class="hour-chart q-mt-md">
            <div v-for="row in hourlyRows" :key="row.hour" class="hour-column">
              <div class="hour-bar-wrap">
                <div
                  class="hour-bar"
                  :style="{
                    height: `${row.count ? Math.max(8, (row.count / maxHourlyRegistrations) * 100) : 0}%`,
                  }"
                />
              </div>
              <div class="hour-label">
                {{ row.hour % 3 === 0 ? row.hour : "" }}
              </div>
            </div>
          </div>
          <q-banner v-else class="state-box q-mt-md"
            >Keine Anmeldezeiten verfügbar.</q-banner
          >
        </section>

        <section class="glass-card q-pa-md">
          <div class="text-subtitle1 text-weight-bold">Events und Tags</div>
          <div class="split-list q-mt-md">
            <div>
              <div class="mini-heading">Events</div>
              <div v-if="eventRows.length" class="mini-list">
                <div
                  v-for="event in eventRows"
                  :key="event.event_id"
                  class="mini-row"
                >
                  <span>{{ event.event_name }}</span>
                  <strong>{{ toNumber(event.anzahl_anmeldungen) }}</strong>
                  <div class="mini-track">
                    <div
                      class="mini-fill"
                      :style="{
                        width: `${Math.max(4, (toNumber(event.anzahl_anmeldungen) / maxEventRegistrations) * 100)}%`,
                      }"
                    />
                  </div>
                </div>
              </div>
              <q-banner v-else class="state-box">Keine Eventdaten.</q-banner>
            </div>

            <div>
              <div class="mini-heading">Tags</div>
              <div v-if="tagRows.length" class="mini-list">
                <div v-for="tag in tagRows" :key="tag.tag_id" class="mini-row">
                  <span>{{ tag.tag_name }}</span>
                  <strong>{{ toNumber(tag.anzahl_workshops) }}</strong>
                  <div class="mini-track">
                    <div
                      class="mini-fill mini-fill--muted"
                      :style="{
                        width: `${Math.max(4, (toNumber(tag.anzahl_workshops) / maxTagWorkshops) * 100)}%`,
                      }"
                    />
                  </div>
                </div>
              </div>
              <q-banner v-else class="state-box">Keine Tagdaten.</q-banner>
            </div>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-value {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
}

.metric-label {
  color: var(--wp-text-muted-light);
  font-size: 0.8rem;
}

body.body--dark .metric-label {
  color: var(--wp-text-muted-dark);
}

.report-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.bar-list,
.timeline,
.mini-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(120, 95, 70, 0.12);
}

.bar-row__top,
.bar-row__meta,
.timeline-row,
.mini-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-row__top {
  justify-content: space-between;
  font-weight: 700;
}

.bar-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-value {
  flex-shrink: 0;
  color: var(--q-primary);
}

.bar-row__meta {
  justify-content: space-between;
  color: var(--wp-text-muted-light);
  font-size: 0.78rem;
  margin-top: 2px;
}

body.body--dark .bar-row__meta {
  color: var(--wp-text-muted-dark);
}

.bar-track,
.timeline-track,
.mini-track {
  overflow: hidden;
  background: rgba(120, 95, 70, 0.12);
}

.bar-track {
  height: 9px;
  border-radius: 999px;
  margin-top: 8px;
}

.bar-fill,
.timeline-fill,
.mini-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f47c2c, #f9b15b);
}

.timeline-row {
  display: grid;
  grid-template-columns: 94px 1fr 34px;
}

.timeline-label,
.timeline-value {
  font-size: 0.8rem;
}

.timeline-value {
  text-align: right;
  font-weight: 700;
}

.timeline-track {
  height: 12px;
  border-radius: 999px;
}

.hour-chart {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 4px;
  height: 180px;
  align-items: end;
}

.hour-column {
  min-width: 0;
}

.hour-bar-wrap {
  height: 148px;
  display: flex;
  align-items: end;
  border-bottom: 1px solid rgba(120, 95, 70, 0.22);
}

.hour-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, #f47c2c, #c85521);
}

.hour-label {
  height: 18px;
  margin-top: 4px;
  text-align: center;
  color: var(--wp-text-muted-light);
  font-size: 0.68rem;
}

body.body--dark .hour-label {
  color: var(--wp-text-muted-dark);
}

.split-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.mini-heading {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--wp-text-muted-light);
  margin-bottom: 8px;
}

body.body--dark .mini-heading {
  color: var(--wp-text-muted-dark);
}

.mini-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
}

.mini-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-row strong {
  text-align: right;
}

.mini-track {
  grid-column: 1 / -1;
  height: 7px;
  border-radius: 999px;
}

.mini-fill--muted {
  background: linear-gradient(90deg, #597b63, #8aac78);
}

@media (max-width: 1100px) {
  .metric-grid,
  .report-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .metric-grid,
  .report-grid,
  .split-list {
    grid-template-columns: 1fr;
  }

  .hour-chart {
    gap: 2px;
  }
}
</style>
