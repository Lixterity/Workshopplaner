import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from './supabaseClient';
import { useAuthStore } from './authStore';
import { useDataStore } from './dataStore';
import { pinia } from './pinia';

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return Number.isNaN(date?.getTime()) ? null : date;
}

function overlappt(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

export const useSocialStore = defineStore('socialStore', () => {
  const auth = useAuthStore(pinia);
  const data = useDataStore(pinia);

  const registrierungen = ref([]);
  const freundschaften = ref([]);

  // ── Registrations ──

  async function fetchRegistrierungen() {
    const { data: rows, error } = await supabase
      .from('workshop_anmeldung')
      .select('*');

    if (!error && Array.isArray(rows)) {
      registrierungen.value = rows;
    }
    return { data: rows, error };
  }

  const meineRegistrierungen = computed(() => {
    if (!auth.userId) return [];
    return registrierungen.value.filter((r) => r.auth_user_id === auth.userId);
  });

  const meineWorkshopIds = computed(() => new Set(meineRegistrierungen.value.map((r) => r.workshop_id)));

  const meineWorkshops = computed(() => {
    const ids = meineWorkshopIds.value;
    return data.workshops
      .filter((w) => ids.has(w.id))
      .sort((a, b) => {
        const aD = parseDate(a.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bD = parseDate(b.anfang_datum_zeit)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aD - bD;
      });
  });

  const meineEventIds = computed(() => {
    const workshopEventIds = data.workshops
      .filter((w) => meineWorkshopIds.value.has(w.id))
      .map((w) => w.event_id);
    return new Set(workshopEventIds);
  });

  const meineEvents = computed(() => data.events.filter((e) => meineEventIds.value.has(e.id)));

  const workshopTeilnehmerCount = computed(() => {
    const countMap = new Map();
    for (const reg of registrierungen.value) {
      countMap.set(reg.workshop_id, (countMap.get(reg.workshop_id) ?? 0) + 1);
    }
    return countMap;
  });

  function workshopBelegung(workshopId) {
    return workshopTeilnehmerCount.value.get(workshopId) ?? 0;
  }

  function isRegisteredForWorkshop(workshopId) {
    if (!auth.userId) return false;
    return registrierungen.value.some(
      (r) => r.auth_user_id === auth.userId && String(r.workshop_id) === String(workshopId),
    );
  }

  function getWorkshopAnmeldungen(workshopId) {
    const userIds = registrierungen.value
      .filter((r) => String(r.workshop_id) === String(workshopId))
      .map((r) => r.auth_user_id);

    return data.teilnehmer.filter((person) => userIds.includes(person.auth_user_id));
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
    if (!auth.istAngemeldet) {
      return { error: new Error('Bitte zuerst anmelden.') };
    }

    const workshop = data.getWorkshopById(workshopId);
    if (!workshop) return { error: new Error('Workshop nicht gefunden.') };

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

    const { data: row, error } = await supabase
      .from('workshop_anmeldung')
      .insert({ auth_user_id: auth.userId, workshop_id: workshop.id })
      .select('*')
      .maybeSingle();

    if (error) return { error };

    registrierungen.value = [...registrierungen.value, row];

    if (!meineEventIds.value.has(workshop.event_id) && auth.profile?.id) {
      await supabase.from('teilnehmer_event').upsert(
        { teilnehmer_id: auth.profile.id, event_id: workshop.event_id },
        { onConflict: 'teilnehmer_id,event_id' },
      );
    }

    return { error: null, data: row };
  }

  async function einladeZuWorkshop(authUserId, workshopId) {
    const workshop = data.getWorkshopById(workshopId);
    if (!workshop) return { error: new Error('Workshop nicht gefunden.') };

    const bereitsAngemeldet = registrierungen.value.some(
      (r) => r.auth_user_id === authUserId && String(r.workshop_id) === String(workshopId),
    );
    if (bereitsAngemeldet) {
      return { error: new Error('Diese Person ist bereits angemeldet.') };
    }

    if (workshop.kapazitaet && workshopBelegung(workshop.id) >= workshop.kapazitaet) {
      return { error: new Error('Dieser Workshop ist bereits voll.') };
    }

    const { data: row, error } = await supabase
      .from('workshop_anmeldung')
      .insert({ auth_user_id: authUserId, workshop_id: workshop.id })
      .select('*')
      .maybeSingle();

    if (error) return { error };

    registrierungen.value = [...registrierungen.value, row];
    return { error: null, data: row };
  }

  async function workshopAbmelden(workshopId) {
    if (!auth.istAngemeldet) {
      return { error: new Error('Bitte zuerst anmelden.') };
    }

    const { error } = await supabase
      .from('workshop_anmeldung')
      .delete()
      .eq('auth_user_id', auth.userId)
      .eq('workshop_id', workshopId);

    if (error) return { error };

    registrierungen.value = registrierungen.value.filter(
      (r) => !(r.auth_user_id === auth.userId && String(r.workshop_id) === String(workshopId)),
    );
    return { error: null };
  }

  // ── Friendships ──

  async function fetchFreundschaften() {
    if (!auth.userId) {
      freundschaften.value = [];
      return { data: [], error: null };
    }

    const { data: rows, error } = await supabase
      .from('freundschaft')
      .select('*');

    if (!error && Array.isArray(rows)) {
      freundschaften.value = rows;
    }
    return { data: rows, error };
  }

  const offeneFreundschaftsanfragen = computed(() => {
    if (!auth.userId) return [];
    return freundschaften.value.filter(
      (f) => f.empfaenger_id === auth.userId && f.status === 'AUSSTEHEND',
    );
  });

  const gesendeteFreundschaftsanfragen = computed(() => {
    if (!auth.userId) return [];
    return freundschaften.value.filter(
      (f) => f.absender_id === auth.userId && f.status === 'AUSSTEHEND',
    );
  });

  const freunde = computed(() => {
    if (!auth.userId) return [];
    const accepted = freundschaften.value.filter((f) => f.status === 'ANGENOMMEN');
    const ids = new Set();
    for (const f of accepted) {
      if (f.absender_id === auth.userId) ids.add(f.empfaenger_id);
      if (f.empfaenger_id === auth.userId) ids.add(f.absender_id);
    }
    return data.teilnehmer.filter((person) => ids.has(person.auth_user_id));
  });

  const verfuegbareFreunde = computed(() => {
    if (!auth.userId) return [];
    const blockedIds = new Set([auth.userId]);
    for (const f of freundschaften.value) {
      if (f.absender_id === auth.userId) blockedIds.add(f.empfaenger_id);
      if (f.empfaenger_id === auth.userId) blockedIds.add(f.absender_id);
    }
    return data.teilnehmer.filter((person) => person.auth_user_id && !blockedIds.has(person.auth_user_id));
  });

  function resolveTeilnehmerByAuthUserId(authUserId) {
    return data.teilnehmer.find((t) => t.auth_user_id === authUserId) ?? null;
  }

  function freundschaftExistiert(andererAuthUserId) {
    return freundschaften.value.some((f) => {
      const direct = f.absender_id === auth.userId && f.empfaenger_id === andererAuthUserId;
      const reverse = f.absender_id === andererAuthUserId && f.empfaenger_id === auth.userId;
      return direct || reverse;
    });
  }

  async function sendeFreundschaftsanfrage(andererAuthUserId) {
    if (!auth.userId) return { error: new Error('Bitte zuerst anmelden.') };
    if (andererAuthUserId === auth.userId) return { error: new Error('Du kannst dir keine Anfrage senden.') };
    if (freundschaftExistiert(andererAuthUserId)) {
      return { error: new Error('Es existiert bereits eine Anfrage oder Freundschaft.') };
    }

    const { data: row, error } = await supabase
      .from('freundschaft')
      .insert({
        absender_id: auth.userId,
        empfaenger_id: andererAuthUserId,
        status: 'AUSSTEHEND',
      })
      .select('*')
      .maybeSingle();

    if (error) return { error };

    freundschaften.value = [...freundschaften.value, row];
    return { error: null };
  }

  async function freundschaftAnnehmen(freundschaftId) {
    const { data: row, error } = await supabase
      .from('freundschaft')
      .update({ status: 'ANGENOMMEN' })
      .eq('id', freundschaftId)
      .select('*')
      .maybeSingle();

    if (error) return { error };

    const idx = freundschaften.value.findIndex((f) => f.id === freundschaftId);
    if (idx >= 0) freundschaften.value[idx] = row;
    return { error: null };
  }

  async function freundschaftAblehnen(freundschaftId) {
    const { error } = await supabase
      .from('freundschaft')
      .delete()
      .eq('id', freundschaftId);

    if (error) return { error };

    freundschaften.value = freundschaften.value.filter((f) => f.id !== freundschaftId);
    return { error: null };
  }

  async function freundEntfernen(authUserId) {
    const record = freundschaften.value.find((f) => {
      const pair =
        (f.absender_id === auth.userId && f.empfaenger_id === authUserId) ||
        (f.absender_id === authUserId && f.empfaenger_id === auth.userId);
      return pair && f.status === 'ANGENOMMEN';
    });

    if (!record) return { error: new Error('Freundschaft nicht gefunden.') };

    const { error } = await supabase.from('freundschaft').delete().eq('id', record.id);
    if (error) return { error };

    freundschaften.value = freundschaften.value.filter((f) => f.id !== record.id);
    return { error: null };
  }

  function meineFreundIdsSet() {
    const set = new Set();
    for (const f of freunde.value) {
      if (f.auth_user_id) set.add(f.auth_user_id);
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

  function friendsInWorkshop(workshopId) {
    const friendIds = meineFreundIdsSet();
    if (!friendIds.size) return [];
    const presentIds = new Set();
    for (const reg of registrierungen.value) {
      if (String(reg.workshop_id) === String(workshopId) && friendIds.has(reg.auth_user_id)) {
        presentIds.add(reg.auth_user_id);
      }
    }
    return data.teilnehmer.filter((person) => presentIds.has(person.auth_user_id));
  }

  function friendCountForEvent(eventId) {
    return friendsInEvent(eventId).length;
  }

  function friendsInEvent(eventId) {
    const workshopIds = data.workshops
      .filter((w) => String(w.event_id) === String(eventId))
      .map((w) => w.id);

    const friendIds = meineFreundIdsSet();
    if (!friendIds.size) return [];

    const presentIds = new Set();
    for (const reg of registrierungen.value) {
      if (workshopIds.includes(reg.workshop_id) && friendIds.has(reg.auth_user_id)) {
        presentIds.add(reg.auth_user_id);
      }
    }
    return data.teilnehmer.filter((person) => presentIds.has(person.auth_user_id));
  }

  // ── Event aggregation ──

  const eventMitWorkshops = computed(() => {
    return data.events.map((event) => {
      const workshopsForEvent = data.workshops.filter((w) => w.event_id === event.id);
      const teilnehmerCount = workshopsForEvent.reduce((acc, w) => acc + workshopBelegung(w.id), 0);
      return {
        ...event,
        workshops: workshopsForEvent,
        workshop_count: workshopsForEvent.length,
        teilnehmer_count: teilnehmerCount,
        friend_count: friendCountForEvent(event.id),
      };
    });
  });

  return {
    registrierungen,
    freundschaften,
    fetchRegistrierungen,
    fetchFreundschaften,
    meineRegistrierungen,
    meineWorkshopIds,
    meineWorkshops,
    meineEventIds,
    meineEvents,
    workshopTeilnehmerCount,
    workshopBelegung,
    isRegisteredForWorkshop,
    getWorkshopAnmeldungen,
    findeZeitkollision,
    workshopAnmelden,
    einladeZuWorkshop,
    workshopAbmelden,
    offeneFreundschaftsanfragen,
    gesendeteFreundschaftsanfragen,
    freunde,
    verfuegbareFreunde,
    resolveTeilnehmerByAuthUserId,
    freundschaftExistiert,
    sendeFreundschaftsanfrage,
    freundschaftAnnehmen,
    freundschaftAblehnen,
    freundEntfernen,
    friendCountForWorkshop,
    friendsInWorkshop,
    friendCountForEvent,
    friendsInEvent,
    eventMitWorkshops,
  };
});
