<script setup>
import { useQuasar } from 'quasar'

const $q = useQuasar()

const highlights = [
  { id: 1, title: 'Workshops im Blick', copy: 'Verwalte Termine, Raeume und Teilnehmer uebersichtlich an einem Ort.' },
  { id: 2, title: 'Schnell startklar', copy: 'Starte mit wenigen Klicks in deine naechste Session - ohne Setup-Aufwand.' },
  { id: 3, title: 'Zusammen arbeiten', copy: 'Teile Plaene mit deinem Team und bleibe immer synchron.' }
]
</script>

<template>
  <q-page
    class="home-page"
    :class="$q.dark.isActive ? 'home-page--dark' : 'home-page--light'"
  >
    <div class="home-content">
      <q-card
        class="hero-card"
        :class="$q.dark.isActive ? 'hero-card--dark text-white' : 'hero-card--light'"
      >
        <img src="/WP_Icon.png" alt="Workshopplaner Logo" class="hero-logo" />
        <div class="text-h4 text-weight-bold q-mt-md">Workshopplaner</div>
        <div class="text-body1 q-mt-sm hero-copy" :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-7'">
          Plane Workshops ohne Stress - alles im Ueberblick, bestens organisiert.
        </div>

        <q-btn
          color="primary"
          label="Jetzt anmelden"
          class="q-mt-xl hero-cta"
          size="lg"
          unelevated
          no-caps
          to="/login"
        />

        <div class="text-caption q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
          Noch kein Konto?
          <router-link to="/register" class="text-primary text-weight-medium">
            Konto erstellen
          </router-link>
        </div>
      </q-card>

      <div class="highlights">
        <q-card
          v-for="item in highlights"
          :key="item.id"
          flat
          bordered
          class="highlight-card"
          :class="$q.dark.isActive ? 'highlight-card--dark text-white' : 'highlight-card--light'"
        >
          <div class="q-pa-lg">
            <div class="text-subtitle1 text-weight-medium" :class="$q.dark.isActive ? 'text-blue-3' : 'text-primary'">
              {{ item.title }}
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
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
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(24px, 5vw, 72px);
  transition: background 0.3s ease;
}
.home-page--light {
  background: linear-gradient(145deg, #f5f7fa 0%, #ffffff 100%);
}
.home-page--dark {
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.2), rgba(15, 23, 42, 0.95));
}
.home-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 5vw, 64px);
}
.hero-card {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-radius: 24px;
  padding: clamp(24px, 6vw, 48px);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.hero-logo {
  width: clamp(48px, 8vw, 72px);
  height: clamp(48px, 8vw, 72px);
  border-radius: 12px;
  object-fit: contain;
}
.hero-copy {
  max-width: 520px;
}
.hero-cta {
  width: min(320px, 100%);
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
  height: 100%;
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  width: 100%;
  margin: 0 auto;
}
@media (max-width: 900px) {
  .home-page {
    padding: 32px 24px 48px;
  }
  .hero-card,
  .highlights {
    max-width: 560px;
  }
}
@media (max-width: 640px) {
  .home-page {
    padding: 24px 16px 40px;
  }
  .hero-card {
    align-items: flex-start;
    text-align: left;
  }
  .highlights {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 420px) {
  .home-page {
    padding: 20px 12px 32px;
  }
  .hero-card {
    border-radius: 18px;
    padding: 24px 16px;
  }
}
</style>
