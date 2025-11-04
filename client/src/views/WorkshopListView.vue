<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { findEvent } from '../data/events'

const props = defineProps({
  eventId: { type: String, required: true }
})

const router = useRouter()
const $q = useQuasar()

const event = computed(() => findEvent(props.eventId))

const formattedWorkshops = computed(() => {
  if (!event.value) {
    return []
  }

  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return event.value.workshops.map(workshop => ({
    ...workshop,
    formattedDate: formatter.format(new Date(workshop.date)),
    spotsLeft: workshop.capacity - workshop.participants.length
  }))
})

const goBack = () => {
  router.push({ name: 'events' })
}

const openWorkshop = workshopId => {
  router.push({ name: 'workshop-detail', params: { eventId: props.eventId, workshopId } })
}
</script>

<template>
  <q-page class="workshop-page q-pa-lg" :class="$q.dark.isActive ? 'bg-dark-page' : 'bg-light-page'">
    <div class="content-wrapper">
      <div class="page-header q-mb-lg">
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          label="Zur Eventliste"
          no-caps
          @click="goBack"
        />

        <template v-if="event">
          <div>
            <div class="eyebrow text-primary text-weight-medium">Event</div>
            <h1 class="text-h4 text-weight-bold q-mb-none">
              {{ event.name }}
            </h1>
            <p class="text-body2 text-grey-7 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : ''">
              {{ event.location }} ·
              {{ new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(event.date)) }}
            </p>
            <p class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-7'">
              {{ event.description }}
            </p>
          </div>
        </template>
      </div>

      <section v-if="event" class="workshop-grid">
        <q-card
          v-for="workshop in formattedWorkshops"
          :key="workshop.id"
          flat
          bordered
          class="workshop-card"
          :class="$q.dark.isActive ? 'workshop-card--dark text-white' : 'workshop-card--light'"
          @click="openWorkshop(workshop.id)"
        >
          <div class="q-pa-md q-gutter-xs">
            <div class="text-subtitle1 text-weight-medium">
              {{ workshop.name }}
            </div>
            <div class="text-body2 text-grey-7" :class="$q.dark.isActive ? 'text-grey-4' : ''">
              {{ workshop.formattedDate }}
            </div>
            <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              Raum: {{ workshop.room }} · {{ workshop.duration }}
            </div>
          </div>
          <q-separator inset />
          <div class="q-pa-md card-footer row items-center justify-between">
            <q-chip outline color="primary" :label="`Freie Plätze: ${workshop.spotsLeft}`" icon="event_seat" />
            <q-icon name="chevron_right" color="primary" />
          </div>
        </q-card>
      </section>

      <q-banner
        v-else
        class="q-mt-lg"
        rounded
        :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-2'"
      >
        <template #avatar>
          <q-icon name="event_busy" color="primary" />
        </template>
        Dieses Event konnte nicht gefunden werden. Bitte kehre zur Übersicht zurück.
      </q-banner>
    </div>
  </q-page>
</template>

<style scoped>
.workshop-page {
  min-height: calc(100vh - 98px);
  transition: background 0.3s ease;
}
.bg-light-page {
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
}
.bg-dark-page {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.2), rgba(11, 20, 33, 0.96));
}
.content-wrapper {
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.page-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.workshop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.workshop-card {
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.workshop-card--light {
  background-color: #ffffff;
  box-shadow: 0 18px 40px rgba(25, 118, 210, 0.08);
}
.workshop-card--dark {
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
}
.workshop-card:hover {
  transform: translateY(-3px);
}
.card-footer {
  padding-top: 12px;
}
@media (max-width: 599px) {
  .workshop-grid {
    grid-template-columns: 1fr;
  }
}
</style>
