<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { useDbStore } from './stores/dbStore';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const dbStore = useDbStore();

const drawerOpen = ref(false);


const navItems = computed(() => {
  const base = [
    { to: '/veranstaltungen', icon: 'celebration', label: 'Events', auth: true },
    { to: '/workshops', icon: 'view_list', label: 'Workshops', auth: true },
    { to: '/meine-workshops', icon: 'calendar_month', label: 'Meine Workshops', auth: true },
    { to: '/meine-events', icon: 'star_outline', label: 'Meine Events', auth: true },
    { to: '/freunde', icon: 'groups', label: 'Freunde', auth: true },
    { to: '/profil', icon: 'account_circle', label: 'Profil', auth: true },
  ];

  if (dbStore.rolle === dbStore.ROLLEN.ORGANISATOR || dbStore.rolle === dbStore.ROLLEN.ADMINISTRATOR) {
    base.push({ to: '/vortragende', icon: 'dashboard', label: 'Dashboard', auth: true });
  }

  if (dbStore.rolle === dbStore.ROLLEN.ADMINISTRATOR) {
    base.push({ to: '/administration/benutzer', icon: 'admin_panel_settings', label: 'Administration', auth: true });
  }

  if (!dbStore.istAngemeldet) {
    return [
      { to: '/anmelden', icon: 'login', label: 'Anmelden' },
      { to: '/registrieren', icon: 'person_add', label: 'Registrieren' },
    ];
  }

  return base;
});

const userKurzname = computed(() => {
  const full = dbStore.profilName || 'Benutzer';
  return full
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

function toggleTheme() {
  $q.dark.set(!$q.dark.isActive);
}

async function logout() {
  await dbStore.handleLogout();
  drawerOpen.value = false;
  await router.push('/anmelden');
}

function gotoProfile() {
  router.push('/profil');
}

// Auth state listener is now managed inside authStore (registered during store creation).
// No need for onAuthStateChange here — the router guard + initStore handle everything.
</script>

<template>
  <q-layout view="hHh Lpr lFf" :class="['app-shell', $q.dark.isActive ? 'app-shell--dark' : 'app-shell--light']">
    <q-header class="app-header" :class="$q.dark.isActive ? 'header-dark' : 'header-light'" elevated>
      <q-toolbar class="toolbar-max-width">
        <q-btn flat dense round icon="menu" class="lt-md q-mr-sm" @click="drawerOpen = !drawerOpen" />

        <q-btn flat no-caps class="brand-button" to="/anmelden">
          <img src="/WP_Icon.png" alt="Logo" class="brand-logo" />
          <div class="brand-text">
            <div class="brand-title">Workshopplaner 2.0</div>
            <div class="brand-subtitle">HTL Wien West</div>
          </div>
        </q-btn>

        <q-space />

        <q-btn
          dense
          round
          flat
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'"
          @click="toggleTheme"
        />

        <q-btn
          v-if="dbStore.istAngemeldet"
          flat
          dense
          class="q-ml-sm user-chip"
          no-caps
          @click="gotoProfile"
        >
          <q-avatar size="30px" color="primary" text-color="white">{{ userKurzname }}</q-avatar>
          <span class="q-ml-sm gt-xs">{{ dbStore.profilName }}</span>
        </q-btn>
      </q-toolbar>

      <q-tabs v-if="route.name !== 'auth-callback'" dense inline-label class="toolbar-max-width gt-sm">
        <q-route-tab
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          no-caps
        />
      </q-tabs>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      side="left"
      bordered
      :width="280"
      :dark="$q.dark.isActive"
      :class="['lt-md', $q.dark.isActive ? 'drawer-dark' : 'drawer-light']"
    >
      <div class="q-pa-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs">Navigation</div>
        <div class="text-caption text-grey-6 q-mb-md">{{ dbStore.istAngemeldet ? dbStore.profilName : 'Nicht angemeldet' }}</div>

        <q-list bordered padding class="rounded-borders">
          <q-item v-for="item in navItems" :key="item.to" clickable :to="item.to" v-ripple>
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <q-btn
          v-if="dbStore.istAngemeldet"
          color="negative"
          icon="logout"
          label="Abmelden"
          class="full-width q-mt-md"
          no-caps
          unelevated
          @click="logout"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-page-sticky v-if="dbStore.istAngemeldet" position="bottom-right" :offset="[18, 18]">
      <q-btn color="negative" icon="logout" round glossy @click="logout" />
    </q-page-sticky>
  </q-layout>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-shell--light {
  background: radial-gradient(circle at top, #fffaf3, #fff6ec);
}

.app-shell--dark {
  background: linear-gradient(180deg, #05080d 0%, #090f17 100%);
}

.app-shell--dark :deep(.q-page-container) {
  background: transparent;
}

.app-header {
  backdrop-filter: blur(8px);
}

.header-light {
  background: linear-gradient(120deg, rgba(242, 135, 51, 0.92), rgba(255, 174, 87, 0.9));
  color: #231e1a;
}

.header-dark {
  background: linear-gradient(120deg, rgba(8, 10, 18, 0.96), rgba(32, 20, 8, 0.95));
  color: #f7c874;
}

.toolbar-max-width {
  width: min(1320px, 100%);
  margin: 0 auto;
}

.brand-button {
  padding-left: 0;
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  margin-right: 10px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-title {
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 0.03em;
}

.brand-subtitle {
  font-size: 0.72rem;
  opacity: 0.85;
}

.user-chip {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 4px 8px;
}

.drawer-light {
  background: #fff;
}

.drawer-dark {
  background: linear-gradient(180deg, #0f141d 0%, #11151d 100%);
  color: #f4e4c7;
}

.drawer-dark :deep(.q-drawer__content) {
  background: transparent;
}

.drawer-dark :deep(.q-list) {
  border-color: rgba(255, 255, 255, 0.18);
}

.drawer-dark :deep(.q-item) {
  color: #f4e4c7;
}

.drawer-dark :deep(.text-grey-6) {
  color: #b89f7a !important;
}
</style>
