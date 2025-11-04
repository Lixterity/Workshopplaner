<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { events } from '../data/events'

const router = useRouter()
const $q = useQuasar()

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const listedEvents = computed(() =>
  events.map(event => {
    const totalWorkshops = event.workshops.length
    const totalParticipants = event.workshops.reduce((sum, item) => sum + item.participants.length, 0)
    const freeSeats = event.workshops.reduce((sum, item) => sum + (item.capacity - item.participants.length), 0)

    return {
      ...event,
      totalWorkshops,
      totalParticipants,
      freeSeats,
      formattedDate: dateFormatter.format(new Date(event.date))
    }
  })
)

const openEvent = eventId => {
  router.push({ name: 'event-workshops', params: { eventId } })
}
</script>

<template>
  <q-page class="event-page q-pa-lg" :class="$q.dark.isActive ? 'bg-dark-page' : 'bg-light-page'">
    <div class="event-wrapper">
      <header class="page-header q-mb-lg">
        <div>
          <h1 class="text-h4 text-weight-bold q-mt-xs q-mb-none">Events</h1>
          <p class="text-body2 text-grey-7 q-mt-sm">
            Stöbere in kommenden Veranstaltungen und sichere dir einen Platz für alle Workshops oder einzelne Sessions.
          </p>
        </div>
        <q-btn
          color="primary"
          icon="event_available"
          label="Neues Event erstellen"
          no-caps
          unelevated
          class="header-action"
        />
      </header>

      <div class="event-grid">
        <q-card
          v-for="event in listedEvents"
          :key="event.id"
          flat
          bordered
          class="event-card"
          :class="$q.dark.isActive ? 'event-card--dark text-white' : 'event-card--light'"
        >
          <div class="event-card__body q-gutter-sm">
            <div class="text-caption text-uppercase text-weight-medium text-primary">
              {{ event.formattedDate }}
            </div>
            <div class="text-h6 text-weight-bold">
              {{ event.name }}
            </div>
            <div class="text-body2 text-grey-6" :class="$q.dark.isActive ? 'text-grey-4' : ''">
              {{ event.location }} · {{ event.totalWorkshops }} Workshops · {{ event.totalParticipants }} Teilnehmer*innen
            </div>
            <div class="text-caption text-grey-6 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-5' : ''">
              Freie Plätze in Workshops: {{ event.freeSeats }}
            </div>
          </div>

          <q-separator spaced />

          <div class="event-card__actions q-pa-sm q-gutter-sm">
            <q-btn
              color="primary"
              icon="list_alt"
              label="Workshops ansehen"
              no-caps
              class="full-width"
              @click="openEvent(event.id)"
            />
            <q-btn
              flat
              color="primary"
              icon="person_add_alt_1"
              label="Für komplettes Event anmelden"
              no-caps
              class="full-width"
            />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.event-page {
  min-height: calc(100vh - 98px);
  transition: background 0.3s ease;
}
.bg-light-page {
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
}
.bg-dark-page {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.2), rgba(11, 20, 33, 0.96));
}
.event-wrapper {
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.header-action {
  align-self: flex-start;
}
.event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.event-card {
  border-radius: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.event-card--light {
  background-color: #ffffff;
  box-shadow: 0 18px 40px rgba(25, 118, 210, 0.08);
}
.event-card--dark {
  background: rgba(15, 23, 42, 0.88);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
}
.event-card:hover {
  transform: translateY(-3px);
}
.event-card__body {
  padding: 22px 24px 0;
}
.event-card__actions {
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
}
@media (max-width: 599px) {
  .header-action {
    width: 100%;
  }
}
</style>
