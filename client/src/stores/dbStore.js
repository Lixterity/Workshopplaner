import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ROLLEN = Object.freeze({
  TEILNEHMER: 'TEILNEHMER',
  ORGANISATOR: 'ORGANISATOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
});

const STORAGE_KEYS = Object.freeze({
  registrierungen: 'wp2_registrierungen_v1',
  freundschaft: 'wp2_freundschaft_v1',
  werkstattOwner: 'wp2_workshop_owner_v1',
  eventOwner: 'wp2_event_owner_v1',
});

function normalizeRolle(rolleName) {
  if (!rolleName || typeof rolleName !== 'string') {
    return ROLLEN.TEILNEHMER;
  }
  const upper = rolleName.trim().toUpperCase();
  if (upper === ROLLEN.ADMINISTRATOR) return ROLLEN.ADMINISTRATOR;
  if (upper === ROLLEN.ORGANISATOR) return ROLLEN.ORGANISATOR;
  return ROLLEN.TEILNEHMER;
}

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return Number.isNaN(date?.getTime()) ? null : date;
}

function overlappt(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function workshopSort(a, b) {
  const aDate = parseDate(a.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDate = parseDate(b.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aDate - bDate;
}

export const useDbStore = defineStore('dbStore', () => {

  const user = ref(null);
  const profile = ref(null);
  const rolle = ref(ROLLEN.TEILNEHMER);

  const events = ref([]);
  const workshops = ref([]);
  const teilnehmer = ref([]);
  const rollen = ref([]);

  const loading = ref(false);
  const initialized = ref(false);

  const registrierungen = ref(loadFromStorage(STORAGE_KEYS.registrierungen, []));
  const freundschaften = ref(loadFromStorage(STORAGE_KEYS.freundschaft, []));
  const workshopOwnerMap = ref(loadFromStorage(STORAGE_KEYS.werkstattOwner, {}));
  const eventOwnerMap = ref(loadFromStorage(STORAGE_KEYS.eventOwner, {}));

  const userEmail = computed(() => user.value?.email ?? '');
  const userId = computed(() => user.value?.id ?? '');

  const profilName = computed(() => {
    if (profile.value?.vorname || profile.value?.nachname) {
      return `${profile.value.vorname ?? ''} ${profile.value.nachname ?? ''}`.trim();
    }
    return user.value?.user_metadata?.first_name || user.value?.email || 'Benutzer';
  });

  const istAngemeldet = computed(() => Boolean(user.value?.id));
  const istAdmin = computed(() => rolle.value === ROLLEN.ADMINISTRATOR);
  const istOrganisator = computed(() => rolle.value === ROLLEN.ORGANISATOR);

  const meineRegistrierungen = computed(() => {
    if (!userId.value) return [];
    return registrierungen.value.filter((item) => item.auth_user_id === userId.value);
  });

  const meineWorkshopIds = computed(() => new Set(meineRegistrierungen.value.map((item) => item.workshop_id)));

  const meineWorkshops = computed(() => {
    const ids = meineWorkshopIds.value;
    return workshops.value.filter((workshop) => ids.has(workshop.id)).sort(workshopSort);
  });

  const meineEventIds = computed(() => {
    const workshopEventIds = workshops.value
      .filter((w) => meineWorkshopIds.value.has(w.id))
      .map((w) => w.event_id);
    return new Set(workshopEventIds);
  });

  const meineEvents = computed(() => events.value.filter((event) => meineEventIds.value.has(event.id)));

  const workshopTeilnehmerCount = computed(() => {
    const countMap = new Map();
    for (const reg of registrierungen.value) {
      const key = reg.workshop_id;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return countMap;
  });

  const offeneFreundschaftsanfragen = computed(() => {
    if (!userId.value) return [];
    return freundschaften.value.filter(
      (item) => item.empfaenger_auth_user_id === userId.value && item.status === 'AUSSTEHEND',
    );
  });

  const gesendeteFreundschaftsanfragen = computed(() => {
    if (!userId.value) return [];
    return freundschaften.value.filter(
      (item) => item.absender_auth_user_id === userId.value && item.status === 'AUSSTEHEND',
    );
  });

  const freunde = computed(() => {
    if (!userId.value) return [];
    const accepted = freundschaften.value.filter((item) => item.status === 'ANGENOMMEN');
    const ids = new Set();
    for (const item of accepted) {
      if (item.absender_auth_user_id === userId.value) ids.add(item.empfaenger_auth_user_id);
      if (item.empfaenger_auth_user_id === userId.value) ids.add(item.absender_auth_user_id);
    }
    return teilnehmer.value.filter((person) => ids.has(person.auth_user_id));
  });

  function persistCollections() {
    saveToStorage(STORAGE_KEYS.registrierungen, registrierungen.value);
    saveToStorage(STORAGE_KEYS.freundschaft, freundschaften.value);
    saveToStorage(STORAGE_KEYS.werkstattOwner, workshopOwnerMap.value);
    saveToStorage(STORAGE_KEYS.eventOwner, eventOwnerMap.value);
  }

  function routeNachRolle() {
    if (rolle.value === ROLLEN.ADMINISTRATOR) return '/administration/benutzer';
    return '/meine-workshops';
  }

  function mapTeilnehmer(item) {
    const rollenName = normalizeRolle(item.rollen?.name);
    return {
      ...item,
      auth_user_id: item.auth_user_id ?? `email:${item.email}`,
      rollen_name: rollenName,
    };
  }

  async function loadSession() {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user ?? null;
    return user.value;
  }

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
      teilnehmer.value = data.map(mapTeilnehmer);
    }
    return { data, error };
  }

  async function fetchProfile() {
    if (!userEmail.value) {
      profile.value = null;
      rolle.value = ROLLEN.TEILNEHMER;
      return { data: null, error: null };
    }

    let { data, error } = await supabase
      .from('teilnehmer')
      .select('*, rollen(name)')
      .eq('email', userEmail.value)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      const defaultVorname = user.value?.user_metadata?.first_name || userEmail.value.split('@')[0];
      const insertPayload = {
        vorname: defaultVorname,
        nachname: '-',
        email: userEmail.value,
      };
      const createResult = await supabase.from('teilnehmer').insert(insertPayload).select('*, rollen(name)').maybeSingle();
      data = createResult.data;
      error = createResult.error;
    }

    if (!error && data) {
      const mapped = mapTeilnehmer({
        ...data,
        auth_user_id: user.value?.id,
      });
      profile.value = mapped;
      rolle.value = mapped.rollen_name;

      const idx = teilnehmer.value.findIndex((item) => item.email === mapped.email);
      if (idx >= 0) {
        teilnehmer.value[idx] = mapped;
      } else {
        teilnehmer.value.unshift(mapped);
      }
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

  async function initStore() {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    await loadSession();
    await Promise.all([fetchRollen(), fetchTeilnehmer(), fetchEvents(), fetchWorkshops()]);
    if (istAngemeldet.value) {
      await fetchProfile();
    }
    initialized.value = true;
    loading.value = false;
  }

  async function refreshAll() {
    await Promise.all([fetchTeilnehmer(), fetchEvents(), fetchWorkshops()]);
    if (istAngemeldet.value) {
      await fetchProfile();
    }
  }

  async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      user.value = data.user;
      await fetchProfile();
    }
    return { data, error };
  }

  async function handleGoogleLogin() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleUserRegister(email, password, username, rollenName = ROLLEN.TEILNEHMER) {
    const normalizedRole = normalizeRolle(rollenName);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: username,
          rolle: normalizedRole,
        },
      },
    });

    if (error) {
      return { data, error };
    }

    user.value = data.user ?? null;

    const rollenEintrag = rollen.value.find((item) => normalizeRolle(item.name) === normalizedRole);
    const split = (username || '').trim().split(' ');
    const vorname = split[0] || username || email.split('@')[0];
    const nachname = split.slice(1).join(' ') || '-';

    await supabase.from('teilnehmer').upsert(
      {
        email,
        vorname,
        nachname,
        rollen_id: rollenEintrag?.id,
      },
      { onConflict: 'email' },
    );

    await fetchTeilnehmer();
    await fetchProfile();
    return { data, error: null };
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    user.value = null;
    profile.value = null;
    rolle.value = ROLLEN.TEILNEHMER;
  }

  async function completeOAuthLogin() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error };

    user.value = data.session?.user ?? null;    if (user.value) {
      await fetchProfile();
    }
    return { data, error: null };
  }

  async function updateProfil(payload) {
    if (!profile.value?.id) {
      return { error: new Error('Kein Profil vorhanden.') };
    }

    const updatePayload = {
      vorname: payload.vorname,
      nachname: payload.nachname,
      erforderliche_stunden: payload.erforderliche_stunden,
    };

    const { data, error } = await supabase
      .from('teilnehmer')
      .update(updatePayload)
      .eq('id', profile.value.id)
      .select('*, rollen(name)')
      .maybeSingle();

    if (!error && data) {
      profile.value = mapTeilnehmer({ ...data, auth_user_id: user.value?.id });
      await fetchTeilnehmer();
    }

    return { data, error };
  }

  function getWorkshopById(workshopId) {
    return workshops.value.find((item) => String(item.id) === String(workshopId));
  }

  function getEventById(eventId) {
    return events.value.find((item) => String(item.id) === String(eventId));
  }

  function meineFreundIdsSet() {
    const set = new Set();
    for (const freund of freunde.value) {
      if (freund.auth_user_id) set.add(freund.auth_user_id);
    }
    return set;
  }

  function friendCountForWorkshop(workshopId) {
    const friendIds = meineFreundIdsSet();
    if (!friendIds.size) return 0;

    let count = 0;
    for (const reg of registrierungen.value) {
      if (reg.workshop_id === workshopId && friendIds.has(reg.auth_user_id)) {
        count += 1;
      }
    }
    return count;
  }

  function friendCountForEvent(eventId) {
    const workshopIds = workshops.value
      .filter((w) => String(w.event_id) === String(eventId))
      .map((w) => w.id);

    const friendIds = meineFreundIdsSet();
    if (!friendIds.size) return 0;

    const presentFriends = new Set();
    for (const reg of registrierungen.value) {
      if (workshopIds.includes(reg.workshop_id) && friendIds.has(reg.auth_user_id)) {
        presentFriends.add(reg.auth_user_id);
      }
    }

    return presentFriends.size;
  }

  function isRegisteredForWorkshop(workshopId) {
    if (!userId.value) return false;
    return registrierungen.value.some(
      (item) => item.auth_user_id === userId.value && String(item.workshop_id) === String(workshopId),
    );
  }

  function workshopBelegung(workshopId) {
    return workshopTeilnehmerCount.value.get(workshopId) ?? 0;
  }

  function canEditWorkshop(workshop) {
    if (rolle.value === ROLLEN.ADMINISTRATOR) return true;
    if (rolle.value !== ROLLEN.ORGANISATOR) return false;

    const owner = workshopOwnerMap.value[String(workshop.id)] ?? workshop.erstellt_von_email;
    return owner === userEmail.value;
  }

  function canEditEvent(event) {
    if (rolle.value === ROLLEN.ADMINISTRATOR) return true;
    if (rolle.value !== ROLLEN.ORGANISATOR) return false;

    const owner = eventOwnerMap.value[String(event.id)] ?? event.erstellt_von_email;
    return owner === userEmail.value;
  }

  function findeZeitkollision(zielWorkshop) {
    const zielStart = parseDate(zielWorkshop.anfang_datum_zeit);
    const zielEnde = parseDate(zielWorkshop.ende_datum_zeit);

    for (const workshop of meineWorkshops.value) {
      const start = parseDate(workshop.anfang_datum_zeit);
      const ende = parseDate(workshop.ende_datum_zeit);
      if (overlappt(start, ende, zielStart, zielEnde)) {
        return workshop;
      }
    }
    return null;
  }

  async function workshopAnmelden(workshopId) {
    if (!istAngemeldet.value) {
      return { error: new Error('Bitte zuerst anmelden.') };
    }

    const workshop = getWorkshopById(workshopId);
    if (!workshop) {
      return { error: new Error('Workshop nicht gefunden.') };
    }

    if (isRegisteredForWorkshop(workshopId)) {
      return { error: new Error('Du bist bereits angemeldet.') };
    }

    if (workshop.kapazitaet && workshopBelegung(workshop.id) >= workshop.kapazitaet) {
      return { error: new Error('Dieser Workshop ist bereits voll.') };
    }

    const kollision = findeZeitkollision(workshop);
    if (kollision) {
      return {
        error: new Error(
          `Zeitkollision mit "${kollision.titel}". Bitte zuerst von einem kollidierenden Workshop abmelden.`,
        ),
      };
    }

    const eintrag = {
      id: Date.now(),
      auth_user_id: userId.value,
      workshop_id: workshop.id,
      created_at: new Date().toISOString(),
    };

    registrierungen.value = [...registrierungen.value, eintrag];
    persistCollections();

    if (!meineEventIds.value.has(workshop.event_id) && profile.value?.id) {
      await supabase.from('teilnehmer_event').upsert(
        {
          teilnehmer_id: profile.value.id,
          event_id: workshop.event_id,
        },
        { onConflict: 'teilnehmer_id,event_id' },
      );
    }

    return { error: null, data: eintrag };
  }

  async function workshopAbmelden(workshopId) {
    if (!istAngemeldet.value) {
      return { error: new Error('Bitte zuerst anmelden.') };
    }

    registrierungen.value = registrierungen.value.filter(
      (item) => !(item.auth_user_id === userId.value && String(item.workshop_id) === String(workshopId)),
    );
    persistCollections();
    return { error: null };
  }

  async function createEvent(payload) {
    const insertPayload = {
      name: payload.name,
      public: payload.public,
    };
    const { data, error } = await supabase.from('event').insert(insertPayload).select('*').maybeSingle();

    if (!error && data) {
      events.value.push(data);
      eventOwnerMap.value[String(data.id)] = userEmail.value;
      persistCollections();
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
      if (idx >= 0) {
        events.value[idx] = data;
      }
    }

    return { data, error };
  }

  async function deleteEvent(eventId) {
    const { error } = await supabase.from('event').delete().eq('id', eventId);
    if (!error) {
      events.value = events.value.filter((item) => item.id !== eventId);
      workshops.value = workshops.value.filter((item) => item.event_id !== eventId);
      delete eventOwnerMap.value[String(eventId)];
      persistCollections();
    }
    return { error };
  }

  async function createWorkshop(payload) {
    const insertPayload = {
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
    };

    const { data, error } = await supabase.from('workshop').insert(insertPayload).select('*').maybeSingle();

    if (!error && data) {
      workshops.value.push(data);
      workshops.value.sort(workshopSort);
      workshopOwnerMap.value[String(data.id)] = userEmail.value;
      persistCollections();
    }

    return { data, error };
  }

  async function updateWorkshop(workshopId, payload) {
    const updatePayload = {
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
    };

    const { data, error } = await supabase
      .from('workshop')
      .update(updatePayload)
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
      registrierungen.value = registrierungen.value.filter((item) => item.workshop_id !== workshopId);
      delete workshopOwnerMap.value[String(workshopId)];
      persistCollections();
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
      if (profile.value?.id === teilnehmerId) {
        await fetchProfile();
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
      teilnehmer.value.unshift(mapTeilnehmer(data));
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
      const mapped = mapTeilnehmer(data);
      const idx = teilnehmer.value.findIndex((item) => item.id === teilnehmerId);
      if (idx >= 0) {
        teilnehmer.value[idx] = mapped;
      }
      if (profile.value?.id === teilnehmerId) {
        profile.value = mapped;
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

  function resolveTeilnehmerByAuthUserId(authUserId) {
    return teilnehmer.value.find((item) => item.auth_user_id === authUserId) ?? null;
  }

  function freundschaftExistiert(andererAuthUserId) {
    return freundschaften.value.some((item) => {
      const direct = item.absender_auth_user_id === userId.value && item.empfaenger_auth_user_id === andererAuthUserId;
      const reverse = item.absender_auth_user_id === andererAuthUserId && item.empfaenger_auth_user_id === userId.value;
      return direct || reverse;
    });
  }

  function sendeFreundschaftsanfrage(andererAuthUserId) {
    if (!userId.value) {
      return { error: new Error('Bitte zuerst anmelden.') };
    }
    if (andererAuthUserId === userId.value) {
      return { error: new Error('Du kannst dir keine Anfrage senden.') };
    }
    if (freundschaftExistiert(andererAuthUserId)) {
      return { error: new Error('Es existiert bereits eine Anfrage oder Freundschaft.') };
    }

    const sender = resolveTeilnehmerByAuthUserId(userId.value);
    const receiver = resolveTeilnehmerByAuthUserId(andererAuthUserId);

    if (!sender || !receiver) {
      return { error: new Error('Teilnehmer nicht gefunden.') };
    }

    freundschaften.value.push({
      id: Date.now(),
      status: 'AUSSTEHEND',
      absender_auth_user_id: userId.value,
      empfaenger_auth_user_id: andererAuthUserId,
      absender_name: `${sender.vorname} ${sender.nachname}`.trim(),
      empfaenger_name: `${receiver.vorname} ${receiver.nachname}`.trim(),
      erstellt_am: new Date().toISOString(),
    });

    persistCollections();
    return { error: null };
  }

  function freundschaftAnnehmen(requestId) {
    const idx = freundschaften.value.findIndex((item) => item.id === requestId);
    if (idx < 0) {
      return { error: new Error('Anfrage nicht gefunden.') };
    }
    freundschaften.value[idx].status = 'ANGENOMMEN';
    persistCollections();
    return { error: null };
  }

  function freundschaftAblehnen(requestId) {
    freundschaften.value = freundschaften.value.filter((item) => item.id !== requestId);
    persistCollections();
    return { error: null };
  }

  function freundEntfernen(authUserId) {
    freundschaften.value = freundschaften.value.filter((item) => {
      const samePair =
        (item.absender_auth_user_id === userId.value && item.empfaenger_auth_user_id === authUserId) ||
        (item.absender_auth_user_id === authUserId && item.empfaenger_auth_user_id === userId.value);
      return !samePair;
    });
    persistCollections();
    return { error: null };
  }

  function getWorkshopAnmeldungen(workshopId) {
    const userIds = registrierungen.value
      .filter((item) => String(item.workshop_id) === String(workshopId))
      .map((item) => item.auth_user_id);

    return teilnehmer.value.filter((person) => userIds.includes(person.auth_user_id));
  }

  function qrCodeUrl(path) {
    const fullUrl = `${window.location.origin}${path}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(fullUrl)}`;
  }

  const eventMitWorkshops = computed(() => {
    return events.value.map((event) => {
      const workshopsForEvent = workshops.value.filter((workshop) => workshop.event_id === event.id);
      const teilnehmerCount = workshopsForEvent.reduce((acc, workshop) => acc + workshopBelegung(workshop.id), 0);
      return {
        ...event,
        workshops: workshopsForEvent,
        workshop_count: workshopsForEvent.length,
        teilnehmer_count: teilnehmerCount,
        friend_count: friendCountForEvent(event.id),
      };
    });
  });

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

  const organisatoren = computed(() =>
    teilnehmer.value.filter((person) => normalizeRolle(person.rollen_name) === ROLLEN.ORGANISATOR),
  );

  const verfuegbareFreunde = computed(() => {
    if (!userId.value) return [];

    const blockedIds = new Set([userId.value]);

    for (const req of freundschaften.value) {
      if (req.absender_auth_user_id === userId.value) blockedIds.add(req.empfaenger_auth_user_id);
      if (req.empfaenger_auth_user_id === userId.value) blockedIds.add(req.absender_auth_user_id);
    }

    return teilnehmer.value.filter((person) => !blockedIds.has(person.auth_user_id));
  });

  return {
    ROLLEN,
    user,
    profile,
    rolle,
    events,
    workshops,
    teilnehmer,
    rollen,
    loading,
    initialized,
    istAngemeldet,
    istAdmin,
    istOrganisator,
    profilName,
    eventMitWorkshops,
    meineWorkshops,
    meineEvents,
    meineWorkshopIds,
    offeneFreundschaftsanfragen,
    gesendeteFreundschaftsanfragen,
    freunde,
    alleOrte,
    organisatoren,
    verfuegbareFreunde,

    initStore,
    refreshAll,
    loadSession,
    fetchProfile,
    fetchRollen,
    fetchTeilnehmer,
    fetchEvents,
    fetchWorkshops,
    handleLogin,
    handleGoogleLogin,
    handleUserRegister,
    handleLogout,
    completeOAuthLogin,

    getWorkshopById,
    getEventById,
    getWorkshopAnmeldungen,
    workshopBelegung,
    isRegisteredForWorkshop,
    workshopAnmelden,
    workshopAbmelden,
    canEditWorkshop,
    canEditEvent,
    friendCountForWorkshop,
    friendCountForEvent,
    qrCodeUrl,

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
    updateProfil,

    sendeFreundschaftsanfrage,
    freundschaftAnnehmen,
    freundschaftAblehnen,
    freundEntfernen,

    routeNachRolle,
    normalizeRolle,
  };
});


