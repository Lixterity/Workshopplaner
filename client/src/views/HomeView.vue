<script setup>
import { computed } from 'vue';
import { useDbStore } from '../stores/dbStore';

const dbStore = useDbStore();

const kpiCards = computed(() => [
  {
    icon: 'calendar_month',
    title: `${dbStore.events.length} Events`,
    subtitle: 'Alle Veranstaltungen zentral verwalten.',
  },
  {
    icon: 'build',
    title: `${dbStore.workshops.length} Workshops`,
    subtitle: 'Mit Kollisionserkennung für Teilnehmer.',
  },
  {
    icon: 'groups',
    title: `${dbStore.teilnehmer.length} Teilnehmer`,
    subtitle: 'Rollen für Teilnehmer, Organisator, Administrator.',
  },
]);
</script>

<template>
  <q-page class="page-shell">
    <div class="content-max home-grid">
      <section class="hero glass-card">
        <div class="hero-copy">
          <p class="hero-eyebrow">Workshopplaner 2.0</p>
          <h1 class="page-title">Workshops, Events und Rollen in einer Plattform</h1>
          <p class="page-subtitle">
            Plane Events, melde Teilnehmer an, verwalte Organisatoren und sehe sofort, wo deine Freunde eingetragen sind.
          </p>

          <div class="hero-actions q-mt-lg">
            <q-btn v-if="!dbStore.istAngemeldet" to="/anmelden" color="primary" label="Jetzt anmelden" no-caps unelevated />
            <q-btn v-if="!dbStore.istAngemeldet" to="/registrieren" flat color="primary" label="Konto erstellen" no-caps />
            <q-btn v-else :to="dbStore.routeNachRolle()" color="primary" label="Zum Dashboard" no-caps unelevated />
          </div>
        </div>

        <div class="hero-panel">
          <q-list bordered separator class="rounded-borders">
            <q-item>
              <q-item-section avatar><q-icon name="check_circle" color="positive" /></q-item-section>
              <q-item-section>Google Login + E-Mail/Passwort</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="check_circle" color="positive" /></q-item-section>
              <q-item-section>Deutschsprachige Routen und UI</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="check_circle" color="positive" /></q-item-section>
              <q-item-section>Freunde, QR Profile und QR Workshops</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="check_circle" color="positive" /></q-item-section>
              <q-item-section>Rollen: TEILNEHMER / ORGANISATOR / ADMINISTRATOR</q-item-section>
            </q-item>
          </q-list>
        </div>
      </section>

      <section class="kpi-grid">
        <q-card v-for="card in kpiCards" :key="card.title" class="glass-card kpi-card q-pa-md">
          <q-icon :name="card.icon" size="30px" color="primary" />
          <div class="text-h6 text-weight-bold q-mt-sm">{{ card.title }}</div>
          <div class="text-body2 text-grey-7">{{ card.subtitle }}</div>
        </q-card>
      </section>
    </div>
  </q-page>
</template>

<style scoped>
.home-grid {
  display: grid;
  gap: 18px;
}

.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  padding: clamp(20px, 3vw, 30px);
}

.hero-eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c76c1f;
  font-weight: 700;
  margin: 0 0 10px;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-panel {
  align-self: center;
}

.kpi-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.kpi-card {
  min-height: 146px;
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
