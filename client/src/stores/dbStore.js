import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
import { useDataStore } from './dataStore';
import { useSocialStore } from './socialStore';
import { ROLLEN, normalizeRolle } from './supabaseClient';
import { pinia } from './pinia';

export { supabase, ROLLEN } from './supabaseClient';

export const useDbStore = defineStore('dbStore', () => {
  const auth = useAuthStore(pinia);
  const data = useDataStore(pinia);
  const social = useSocialStore(pinia);

  // ── Computed passthrough (auth) ──
  const user = computed({ get: () => auth.user, set: (v) => { auth.user = v; } });
  const profile = computed({ get: () => auth.profile, set: (v) => { auth.profile = v; } });
  const rolle = computed({ get: () => auth.rolle, set: (v) => { auth.rolle = v; } });
  const userEmail = computed(() => auth.userEmail);
  const userId = computed(() => auth.userId);
  const profilName = computed(() => auth.profilName);
  const istAngemeldet = computed(() => auth.istAngemeldet);
  const istAdmin = computed(() => auth.istAdmin);
  const istOrganisator = computed(() => auth.istOrganisator);

  // ── Computed passthrough (data) ──
  const events = computed(() => data.events);
  const workshops = computed(() => data.workshops);
  const teilnehmer = computed(() => data.teilnehmer);
  const rollen = computed(() => data.rollen);
  const loading = computed(() => data.loading);
  const initialized = computed(() => data.initialized);
  const organisatoren = computed(() => data.organisatoren);
  const alleOrte = computed(() => data.alleOrte);

  // ── Computed passthrough (social) ──
  const registrierungen = computed({ get: () => social.registrierungen, set: (v) => { social.registrierungen = v; } });
  const freundschaften = computed({ get: () => social.freundschaften, set: (v) => { social.freundschaften = v; } });
  const meineRegistrierungen = computed(() => social.meineRegistrierungen);
  const meineWorkshopIds = computed(() => social.meineWorkshopIds);
  const meineWorkshops = computed(() => social.meineWorkshops);
  const meineEventIds = computed(() => social.meineEventIds);
  const meineEvents = computed(() => social.meineEvents);
  const offeneFreundschaftsanfragen = computed(() => social.offeneFreundschaftsanfragen);
  const gesendeteFreundschaftsanfragen = computed(() => social.gesendeteFreundschaftsanfragen);
  const freunde = computed(() => social.freunde);
  const verfuegbareFreunde = computed(() => social.verfuegbareFreunde);
  const eventMitWorkshops = computed(() => social.eventMitWorkshops);

  // ── Actions ──

  async function initStore() {
    if (data.initialized) return;

    data.loading = true;
    try {
      await auth.loadSession();

      await Promise.allSettled([
        data.fetchRollen(),
        data.fetchTeilnehmer(),
        data.fetchEvents(),
        data.fetchWorkshops(),
      ]);

      if (auth.istAngemeldet) {
        const { error } = await auth.fetchProfile(data.teilnehmer);
        if (error || !auth.profile) {
          await auth.handleLogout();
          data.initialized = true;
          return;
        }
        await Promise.allSettled([
          social.fetchRegistrierungen(),
          social.fetchFreundschaften(),
        ]);
      }

      data.initialized = true;
    } catch (err) {
      console.error('[initStore]', err);
    } finally {
      data.loading = false;
    }
  }

  async function refreshAll() {
    await Promise.all([data.fetchTeilnehmer(), data.fetchEvents(), data.fetchWorkshops()]);
    if (auth.istAngemeldet) {
      await auth.fetchProfile(data.teilnehmer);
      await Promise.all([social.fetchRegistrierungen(), social.fetchFreundschaften()]);
    }
  }

  async function handleLogin(email, password) {
    const result = await auth.handleLogin(email, password);
    if (!result.error) {
      await auth.fetchProfile(data.teilnehmer);
      await Promise.all([social.fetchRegistrierungen(), social.fetchFreundschaften()]);
    }
    return result;
  }

  async function handleUserRegister(email, password, vorname, nachname, rollenName) {
    const result = await auth.handleUserRegister(email, password, vorname, nachname, rollenName, data.rollen);
    if (!result.error) {
      await data.fetchTeilnehmer();
      await auth.fetchProfile(data.teilnehmer);
    }
    return result;
  }

  async function completeOAuthLogin() {
    const result = await auth.completeOAuthLogin();
    if (!result.error && auth.user) {
      await auth.fetchProfile(data.teilnehmer);
      await Promise.all([social.fetchRegistrierungen(), social.fetchFreundschaften()]);
    }
    return result;
  }

  async function updateProfil(payload) {
    return auth.updateProfil(payload, data.teilnehmer);
  }

  return {
    ROLLEN,
    normalizeRolle,

    // Auth state
    user,
    profile,
    rolle,
    userEmail,
    userId,
    profilName,
    istAngemeldet,
    istAdmin,
    istOrganisator,

    // Data state
    events,
    workshops,
    teilnehmer,
    rollen,
    loading,
    initialized,
    organisatoren,
    alleOrte,

    // Social state
    registrierungen,
    freundschaften,
    meineRegistrierungen,
    meineWorkshopIds,
    meineWorkshops,
    meineEventIds,
    meineEvents,
    offeneFreundschaftsanfragen,
    gesendeteFreundschaftsanfragen,
    freunde,
    verfuegbareFreunde,
    eventMitWorkshops,

    // Init
    initStore,
    refreshAll,

    // Auth actions
    loadSession: auth.loadSession,
    fetchProfile: () => auth.fetchProfile(data.teilnehmer),
    fetchRollen: data.fetchRollen,
    fetchTeilnehmer: data.fetchTeilnehmer,
    fetchEvents: data.fetchEvents,
    fetchWorkshops: data.fetchWorkshops,
    fetchRegistrierungen: social.fetchRegistrierungen,
    fetchFreundschaften: social.fetchFreundschaften,

    handleLogin,
    handleGoogleLogin: auth.handleGoogleLogin,
    handleUserRegister,
    handleLogout: auth.handleLogout,
    completeOAuthLogin,

    // Data actions
    getWorkshopById: data.getWorkshopById,
    getEventById: data.getEventById,
    canEditWorkshop: data.canEditWorkshop,
    canEditEvent: data.canEditEvent,
    createEvent: data.createEvent,
    updateEvent: data.updateEvent,
    deleteEvent: data.deleteEvent,
    createWorkshop: data.createWorkshop,
    updateWorkshop: data.updateWorkshop,
    deleteWorkshop: data.deleteWorkshop,
    setUserRole: data.setUserRole,
    createTeilnehmer: data.createTeilnehmer,
    updateTeilnehmer: data.updateTeilnehmer,
    deleteTeilnehmer: data.deleteTeilnehmer,
    updateProfil,
    qrCodeUrl: data.qrCodeUrl,
    routeNachRolle: data.routeNachRolle,

    // Social actions
    workshopBelegung: social.workshopBelegung,
    isRegisteredForWorkshop: social.isRegisteredForWorkshop,
    getWorkshopAnmeldungen: social.getWorkshopAnmeldungen,
    workshopAnmelden: social.workshopAnmelden,
    einladeZuWorkshop: social.einladeZuWorkshop,
    workshopAbmelden: social.workshopAbmelden,
    sendeFreundschaftsanfrage: social.sendeFreundschaftsanfrage,
    freundschaftAnnehmen: social.freundschaftAnnehmen,
    freundschaftAblehnen: social.freundschaftAblehnen,
    freundEntfernen: social.freundEntfernen,
    friendCountForWorkshop: social.friendCountForWorkshop,
    friendsInWorkshop: social.friendsInWorkshop,
    friendCountForEvent: social.friendCountForEvent,
    friendsInEvent: social.friendsInEvent,
    resolveTeilnehmerByAuthUserId: social.resolveTeilnehmerByAuthUserId,
  };
});
