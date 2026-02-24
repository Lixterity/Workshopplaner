import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase, ROLLEN, normalizeRolle } from './supabaseClient';
import { useAuthStore } from './authStore';
import { pinia } from './pinia';

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return Number.isNaN(date?.getTime()) ? null : date;
}

function workshopSort(a, b) {
  const aDate = parseDate(a.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDate = parseDate(b.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aDate - bDate;
}

export const useDataStore = defineStore('dataStore', () => {
  const auth = useAuthStore(pinia);

  const events = ref([]);
  const workshops = ref([]);
  const teilnehmer = ref([]);
  const rollen = ref([]);
  const loading = ref(false);
  const initialized = ref(false);

  const organisatoren = computed(() =>
    teilnehmer.value.filter((person) => normalizeRolle(person.rollen_name) === ROLLEN.ORGANISATOR),
  );

  const alleOrte = computed(() => {
    const map = new Map();
    for (const workshop of workshops.value) {
      const key = `${workshop.adresse ?? ''}-${workshop.raum ?? ''}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          adresse: workshop.adresse || 'Keine Adresse',
          raum: workshop.raum || 'Kein Raum',
          anzahlWorkshops: 1,
        });
      } else {
        map.get(key).anzahlWorkshops += 1;
      }
    }
    return [...map.values()].sort((a, b) => a.adresse.localeCompare(b.adresse));
  });

  async function fetchRollen() {
    const { data, error } = await supabase.from('rollen').select('*').order('id', { ascending: true });
    if (!error && Array.isArray(data)) {
      rollen.value = data;
    }
    return { data, error };
  }

  async function fetchTeilnehmer() {
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*, rollen(name)')
      .order('id', { ascending: true });

    if (!error && Array.isArray(data)) {
      teilnehmer.value = data.map(auth.mapTeilnehmer);
    }
    return { data, error };
  }

  async function fetchEvents() {
    const { data, error } = await supabase.from('event').select('*').order('id', { ascending: true });
    if (!error && Array.isArray(data)) {
      events.value = data;
    }
    return { data, error };
  }

  async function fetchWorkshops() {
    const { data, error } = await supabase
      .from('workshop')
      .select('*')
      .order('anfang_datum_zeit', { ascending: true, nullsFirst: false });

    if (!error && Array.isArray(data)) {
      workshops.value = data;
    }
    return { data, error };
  }

  function getWorkshopById(workshopId) {
    return workshops.value.find((item) => String(item.id) === String(workshopId));
  }

  function getEventById(eventId) {
    return events.value.find((item) => String(item.id) === String(eventId));
  }

  function canEditWorkshop(workshop) {
    if (auth.rolle === ROLLEN.ADMINISTRATOR) return true;
    if (auth.rolle !== ROLLEN.ORGANISATOR) return false;
    return workshop.created_by === auth.userId;
  }

  function canEditEvent(event) {
    if (auth.rolle === ROLLEN.ADMINISTRATOR) return true;
    if (auth.rolle !== ROLLEN.ORGANISATOR) return false;
    return event.created_by === auth.userId;
  }

  async function createEvent(payload) {
    const { data, error } = await supabase
      .from('event')
      .insert({
        name: payload.name,
        public: payload.public,
        created_by: auth.userId,
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      events.value.push(data);
    }
    return { data, error };
  }

  async function updateEvent(eventId, payload) {
    const { data, error } = await supabase
      .from('event')
      .update({ name: payload.name, public: payload.public })
      .eq('id', eventId)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      const idx = events.value.findIndex((item) => item.id === data.id);
      if (idx >= 0) events.value[idx] = data;
    }
    return { data, error };
  }

  async function deleteEvent(eventId) {
    const { error } = await supabase.from('event').delete().eq('id', eventId);
    if (!error) {
      events.value = events.value.filter((item) => item.id !== eventId);
      workshops.value = workshops.value.filter((item) => item.event_id !== eventId);
    }
    return { error };
  }

  async function createWorkshop(payload) {
    const { data, error } = await supabase
      .from('workshop')
      .insert({
        event_id: payload.event_id,
        titel: payload.titel,
        beschreibung: payload.beschreibung,
        kapazitaet: payload.kapazitaet,
        raum: payload.raum,
        adresse: payload.adresse,
        kosten: payload.kosten,
        anfang_datum_zeit: payload.anfang_datum_zeit,
        ende_datum_zeit: payload.ende_datum_zeit,
        public: payload.public,
        created_by: auth.userId,
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      workshops.value.push(data);
      workshops.value.sort(workshopSort);
    }
    return { data, error };
  }

  async function updateWorkshop(workshopId, payload) {
    const { data, error } = await supabase
      .from('workshop')
      .update({
        titel: payload.titel,
        beschreibung: payload.beschreibung,
        kapazitaet: payload.kapazitaet,
        raum: payload.raum,
        adresse: payload.adresse,
        kosten: payload.kosten,
        anfang_datum_zeit: payload.anfang_datum_zeit,
        ende_datum_zeit: payload.ende_datum_zeit,
        public: payload.public,
        event_id: payload.event_id,
      })
      .eq('id', workshopId)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      const idx = workshops.value.findIndex((item) => item.id === data.id);
      if (idx >= 0) {
        workshops.value[idx] = data;
        workshops.value.sort(workshopSort);
      }
    }
    return { data, error };
  }

  async function deleteWorkshop(workshopId) {
    const { error } = await supabase.from('workshop').delete().eq('id', workshopId);
    if (!error) {
      workshops.value = workshops.value.filter((item) => item.id !== workshopId);
    }
    return { error };
  }

  async function setUserRole(teilnehmerId, rollenName) {
    const rollenEintrag = rollen.value.find((item) => normalizeRolle(item.name) === normalizeRolle(rollenName));
    if (!rollenEintrag) {
      return { error: new Error('Rolle nicht gefunden.') };
    }

    const { data, error } = await supabase
      .from('teilnehmer')
      .update({ rollen_id: rollenEintrag.id })
      .eq('id', teilnehmerId)
      .select('*, rollen(name)')
      .maybeSingle();

    if (!error && data) {
      await fetchTeilnehmer();
      if (auth.profile?.id === teilnehmerId) {
        await auth.fetchProfile(teilnehmer);
      }
    }
    return { data, error };
  }

  async function createTeilnehmer(payload) {
    const rollenEintrag = rollen.value.find((item) => normalizeRolle(item.name) === normalizeRolle(payload.rollen_name));
    const { data, error } = await supabase
      .from('teilnehmer')
      .insert({
        vorname: payload.vorname,
        nachname: payload.nachname,
        email: payload.email,
        rollen_id: rollenEintrag?.id,
      })
      .select('*, rollen(name)')
      .maybeSingle();

    if (!error && data) {
      teilnehmer.value.unshift(auth.mapTeilnehmer(data));
    }
    return { data, error };
  }

  async function updateTeilnehmer(teilnehmerId, payload) {
    const { data, error } = await supabase
      .from('teilnehmer')
      .update({
        vorname: payload.vorname,
        nachname: payload.nachname,
        email: payload.email,
      })
      .eq('id', teilnehmerId)
      .select('*, rollen(name)')
      .maybeSingle();

    if (!error && data) {
      const mapped = auth.mapTeilnehmer(data);
      const idx = teilnehmer.value.findIndex((item) => item.id === teilnehmerId);
      if (idx >= 0) teilnehmer.value[idx] = mapped;
      if (auth.profile?.id === teilnehmerId) {
        auth.profile = mapped;
      }
    }
    return { data, error };
  }

  async function deleteTeilnehmer(teilnehmerId) {
    const { error } = await supabase.from('teilnehmer').delete().eq('id', teilnehmerId);
    if (!error) {
      teilnehmer.value = teilnehmer.value.filter((item) => item.id !== teilnehmerId);
    }
    return { error };
  }

  function qrCodeUrl(path) {
    const fullUrl = `${window.location.origin}${path}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(fullUrl)}`;
  }

  function routeNachRolle() {
    if (auth.rolle === ROLLEN.ADMINISTRATOR) return '/administration/benutzer';
    return '/meine-workshops';
  }

  return {
    events,
    workshops,
    teilnehmer,
    rollen,
    loading,
    initialized,
    organisatoren,
    alleOrte,
    fetchRollen,
    fetchTeilnehmer,
    fetchEvents,
    fetchWorkshops,
    getWorkshopById,
    getEventById,
    canEditWorkshop,
    canEditEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    setUserRole,
    createTeilnehmer,
    updateTeilnehmer,
    deleteTeilnehmer,
    qrCodeUrl,
    routeNachRolle,
  };
});
