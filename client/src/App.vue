<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const isDark = computed({
  get: () => $q.dark.isActive,
  set: (val) => {
    $q.dark.set(val);
  },
});
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      :class="[isDark ? 'bg-blue-grey-10 text-white' : 'bg-primary text-white']"
      height-hint="98"
    >
      <q-toolbar>
        <q-icon name="event" size="32px" class="q-mr-sm" />

        <q-toolbar-title>
          Workshopplaner
        </q-toolbar-title>

        <q-space />

        <q-btn
          dense
          round
          flat
          :icon="isDark ? 'dark_mode' : 'light_mode'"
          @click="isDark = !isDark"
          class="text-white"
          :aria-label="isDark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'"
        >
          <q-tooltip anchor="top middle" self="bottom middle">
            {{ isDark ? 'Lichtmodus' : 'Dunkelmodus' }}
          </q-tooltip>
        </q-btn>
      </q-toolbar>

      <q-tabs align="left" dense indicator-color="white">
        <q-route-tab to="/" label="Home" exact />
        <q-route-tab to="/login" label="Login" />
        <q-route-tab to="/register" label="Registrieren" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/Montserrat/Montserrat-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'Lora';
  src: url('/fonts/Lora/Lora-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'LibreBodoni';
  src: url('/fonts/LibreBodoni/LibreBodoni-Regular.ttf') format('truetype');
}

* {
  font-family: 'Montserrat';
}

body {
  background-color: #f5f7fa;
  transition: background-color 0.3s ease;
}

body.body--dark {
  background-color: #0f172a;
}
</style>
