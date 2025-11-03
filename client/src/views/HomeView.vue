<script setup>
import { useQuasar } from 'quasar';

const $q = useQuasar();

const highlights = [
  {
    id: 1,
    title: 'Workshops im Blick',
    copy: 'Verwalte Termine, Räume und Teilnehmer übersichtlich an einem Ort.',
  },
  {
    id: 2,
    title: 'Schnell startklar',
    copy: 'Starte mit wenigen Klicks in deine nächste Session – ohne Setup-Aufwand.',
  },
  {
    id: 3,
    title: 'Zusammen arbeiten',
    copy: 'Teile Pläne mit deinem Team und bleibe immer synchron.',
  },
];
</script>

<template>
  <q-page
    class="flex flex-center"
    :class="['home-page q-pa-xl', $q.dark.isActive ? 'home-page--dark' : 'home-page--light']"
  >
    <div class="home-content q-gutter-xl">
      <q-card
        class="hero-card q-pa-xl column items-center text-center"
        :class="$q.dark.isActive ? 'hero-card--dark text-white' : 'hero-card--light'"
      >
        <q-icon name="event_note" size="48px" color="primary" />
        <div class="text-h4 text-weight-bold q-mt-md">Workshopplaner</div>
        <div
          class="text-body1 q-mt-sm"
          :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-7'"
        >
          Plane Workshops ohne Stress – alles im Überblick, bestens organisiert.
        </div>

        <q-btn
          color="primary"
          label="Jetzt anmelden"
          class="q-mt-xl full-width"
          size="lg"
          unelevated
          no-caps
          to="/login"
        />

        <div
          class="text-caption q-mt-md"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
        >
          Noch kein Konto?
          <router-link to="/register" class="text-primary text-weight-medium">
            Konto erstellen
          </router-link>
        </div>
      </q-card>

      <div class="highlights row q-col-gutter-xl">
        <q-card
          v-for="item in highlights"
          :key="item.id"
          flat
          bordered
          class="highlight-card col-12 col-md-4"
          :class="$q.dark.isActive ? 'highlight-card--dark text-white' : 'highlight-card--light'"
        >
          <div class="q-pa-lg">
            <div
              class="text-subtitle1 text-weight-medium"
              :class="$q.dark.isActive ? 'text-blue-3' : 'text-primary'"
            >
              {{ item.title }}
            </div>
            <div
              class="text-body2 q-mt-sm"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
            >
              {{ item.copy }}
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.home-page {
  width: 100%;
  min-height: calc(100vh - 98px);
  transition: background 0.3s ease;
}

.home-page--light {
  background: linear-gradient(145deg, #f5f7fa 0%, #ffffff 100%);
}

.home-page--dark {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.2), rgba(15, 23, 42, 0.95));
}

.home-content {
  max-width: 900px;
  width: 100%;
}

.hero-card {
  border-radius: 24px;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.hero-card--light {
  background-color: #ffffff;
  box-shadow: 0 18px 45px rgba(25, 118, 210, 0.08);
}

.hero-card--dark {
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}

.highlight-card {
  border-radius: 20px;
  min-width: 0;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.highlight-card--light {
  background-color: #ffffff;
  box-shadow: 0 10px 25px rgba(25, 118, 210, 0.06);
}

.highlight-card--dark {
  background: rgba(15, 23, 42, 0.85);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
}

.highlights {
  max-width: 900px;
  margin: 0 auto;
}
</style>
