<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { findWorkshop } from '../data/events'

const props = defineProps({
  eventId: { type: String, required: true },
  workshopId: { type: String, required: true }
})

const router = useRouter()
const $q = useQuasar()

const details = computed(() => findWorkshop(props.eventId, props.workshopId))
const workshop = computed(() => details.value.workshop)
const event = computed(() => details.value.event)

const formatted = computed(() => {
  if (!workshop.value) {
    return null
  }

  const datetimeFormatter = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const startDate = new Date(workshop.value.date)
  const spotsLeft = workshop.value.capacity - workshop.value.participants.length

  return {
    dateTime: datetimeFormatter.format(startDate),
    spotsLeft,
    isFull: spotsLeft <= 0,
    occupancyLabel: `${workshop.value.participants.length}/${workshop.value.capacity}`
  }
})

const goBack = () => {
  router.push({ name: 'event-workshops', params: { eventId: props.eventId } })
}
</script>

<template>
  <q-page class="detail-page q-pa-lg" :class="$q.dark.isActive ? 'bg-dark-page' : 'bg-light-page'">
    <div class="detail-wrapper">
      <q-btn
        flat
        color="primary"
        icon="arrow_back"
        label="Zur Workshopliste"
        no-caps
        class="q-mb-lg"
        @click="goBack"
      />

      <q-card
        v-if="workshop && formatted"
        flat
        bordered
        class="detail-card"
        :class="$q.dark.isActive ? 'detail-card--dark text-white' : 'detail-card--light'"
      >
        <div class="card-header">
          <div class="card-title row items-center justify-between">
            <div>
              <div class="eyebrow text-primary text-weight-medium">
                {{ event?.name ?? 'Event' }}
              </div>
              <h1 class="text-h5 text-weight-bold q-mb-none">
                {{ workshop.name }}
              </h1>
            </div>
            <q-chip
              :color="formatted.isFull ? 'negative' : 'positive'"
              text-color="white"
              icon="people_alt"
              size="md"
              :label="formatted.isFull ? 'Ausgebucht' : 'Plätze frei'"
            />
          </div>

          <p class="text-body2 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
            {{ workshop.description }}
          </p>
        </div>

        <q-separator spaced />

        <div class="info-grid">
          <div class="info-item">
            <q-icon name="group" color="primary" size="28px" />
            <div>
              <div class="label">Zielgruppe</div>
              <div class="value">
                {{ workshop.targetGroup }}
              </div>
            </div>
          </div>

          <div class="info-item">
            <q-icon name="event" color="primary" size="28px" />
            <div>
              <div class="label">Datum & Zeit</div>
              <div class="value">
                {{ formatted.dateTime }} · {{ workshop.duration }}
              </div>
            </div>
          </div>

          <div class="info-item">
            <q-icon name="meeting_room" color="primary" size="28px" />
            <div>
              <div class="label">Ort</div>
              <div class="value">
                {{ workshop.room }}
              </div>
            </div>
          </div>

          <div class="info-item">
            <q-icon name="savings" color="primary" size="28px" />
            <div>
              <div class="label">Kosten</div>
              <div class="value">
                {{ workshop.cost }}
              </div>
            </div>
          </div>

          <div class="info-item">
            <q-icon name="how_to_reg" color="primary" size="28px" />
            <div>
              <div class="label">Kapazität</div>
              <div class="value">
                {{ formatted.occupancyLabel }} Plätze
              </div>
            </div>
          </div>
        </div>

        <q-separator spaced />

        <section class="section-block">
          <h2 class="text-subtitle1 text-weight-medium q-mb-sm">Organisator*innen</h2>
          <div class="chip-group">
            <q-chip
              v-for="host in workshop.hosts"
              :key="host"
              color="primary"
              outline
              icon="person"
              :label="host"
            />
          </div>
        </section>

        <section class="section-block">
          <div class="participants-header row items-center justify-between q-mb-sm">
            <h2 class="text-subtitle1 text-weight-medium q-mb-none">
              Teilnehmer*innen
            </h2>
            <q-chip dense color="primary" text-color="white" icon="groups" :label="formatted.occupancyLabel" />
          </div>
          <ul class="participant-list">
            <li v-for="participant in workshop.participants" :key="participant">
              <q-icon name="fiber_manual_record" size="8px" color="primary" class="q-mr-sm" />
              <span>{{ participant }}</span>
            </li>
          </ul>
        </section>

        <q-separator spaced />

        <div class="action-bar column q-gutter-sm">
          <q-btn
            color="primary"
            icon="event_available"
            label="Für Workshop Anmelden"
            no-caps
            unelevated
            :disable="formatted.isFull"
          />
          <q-btn
            flat
            color="primary"
            icon="checklist"
            label="Für komplettes Event Anmelden"
            no-caps
          />
        </div>
      </q-card>

      <q-banner
        v-else
        class="q-mt-lg"
        rounded
        :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-2'"
      >
        <template #avatar>
          <q-icon name="help_outline" color="primary" />
        </template>
        Dieser Workshop konnte nicht gefunden werden. Bitte kehre zur Eventübersicht zurück.
      </q-banner>
    </div>
  </q-page>
</template>

<style scoped>
.detail-page {
  min-height: calc(100vh - 98px);
  transition: background 0.3s ease;
}
.bg-light-page {
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
}
.bg-dark-page {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.2), rgba(11, 20, 33, 0.96));
}
.detail-wrapper {
  max-width: 880px;
  margin: 0 auto;
  width: 100%;
}
.detail-card {
  border-radius: 24px;
  padding: 32px;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.detail-card--light {
  background-color: #ffffff;
  box-shadow: 0 24px 55px rgba(25, 118, 210, 0.1);
}
.detail-card--dark {
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 24px 55px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
}
.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin: 8px 0 12px;
}
.info-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(28, 32, 38, 0.6);
}
.value {
  font-size: 0.95rem;
  font-weight: 500;
}
.detail-card--dark .label {
  color: rgba(255, 255, 255, 0.6);
}
.detail-card--dark .value {
  color: rgba(255, 255, 255, 0.92);
}
.section-block + .section-block {
  margin-top: 20px;
}
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.participant-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px;
}
.participant-list li {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}
.participants-header {
  gap: 10px;
}
.action-bar {
  margin-top: 24px;
}
@media (max-width: 768px) {
  .detail-card {
    padding: 24px;
  }
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}
</style>
