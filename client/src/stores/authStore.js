import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase, ROLLEN, normalizeRolle } from './supabaseClient';

export const useAuthStore = defineStore('authStore', () => {
  const user = ref(null);
  const profile = ref(null);
  const rolle = ref(ROLLEN.TEILNEHMER);

  // Promise that resolves once the Supabase client has delivered the initial session.
  // In supabase-js v2.39+ getSession() hangs unless onAuthStateChange is registered first,
  // so we listen for INITIAL_SESSION and use that to seed the user ref.
  let _resolveInitialSession;
  const initialSessionReady = new Promise((resolve) => {
    _resolveInitialSession = resolve;
  });

  // This listener is set up synchronously during store creation, guaranteeing
  // it exists before any code calls loadSession().
  const { data: { subscription: _authSubscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'INITIAL_SESSION') {
        user.value = session?.user ?? null;
        _resolveInitialSession();
        return;
      }

      // TOKEN_REFRESHED keeps the user ref up to date with the latest token
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        user.value = session?.user ?? null;
      }

      if (event === 'SIGNED_OUT') {
        user.value = null;
        profile.value = null;
        rolle.value = ROLLEN.TEILNEHMER;
      }
    },
  );

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

  function mapTeilnehmer(item) {
    return {
      ...item,
      rollen_name: normalizeRolle(item.rollen?.name),
    };
  }

  async function loadSession() {
    await initialSessionReady;
    return user.value;
  }

  async function fetchProfile(teilnehmerRef) {
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

    if (error) return { data: null, error };

    if (!data) {
      const defaultVorname = user.value?.user_metadata?.first_name || userEmail.value.split('@')[0];
      const { data: rollenRows } = await supabase.from('rollen').select('id').eq('name', 'TEILNEHMER').maybeSingle();
      const createResult = await supabase
        .from('teilnehmer')
        .insert({
          vorname: defaultVorname,
          nachname: '',
          email: userEmail.value,
          auth_user_id: user.value.id,
          rollen_id: rollenRows?.id ?? null,
        })
        .select('*, rollen(name)')
        .maybeSingle();
      data = createResult.data;
      error = createResult.error;
    } else if (!data.auth_user_id) {
      await supabase
        .from('teilnehmer')
        .update({ auth_user_id: user.value.id })
        .eq('id', data.id);
      data.auth_user_id = user.value.id;
    }

    if (!error && data) {
      const mapped = mapTeilnehmer(data);
      profile.value = mapped;
      rolle.value = mapped.rollen_name;

      if (teilnehmerRef) {
        const list = teilnehmerRef.value ?? teilnehmerRef;
        const idx = list.findIndex((item) => item.email === mapped.email);
        if (idx >= 0) {
          list[idx] = mapped;
        } else {
          list.unshift(mapped);
        }
      }
    }

    return { data, error };
  }

  async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      user.value = data.user;
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

  async function handleUserRegister(email, password, vorname, nachname, rollenName = ROLLEN.TEILNEHMER, rollenListOrRef) {
    const normalizedRole = normalizeRolle(rollenName);
    const displayName = `${vorname} ${nachname}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: displayName,
          rolle: normalizedRole,
        },
      },
    });

    if (error) return { data, error };

    user.value = data.user ?? null;

    const rollenList = rollenListOrRef?.value ?? rollenListOrRef ?? [];
    const rollenEintrag = rollenList.find((item) => normalizeRolle(item.name) === normalizedRole);

    await supabase.from('teilnehmer').upsert(
      {
        email,
        vorname: vorname || email.split('@')[0],
        nachname: nachname || '',
        rollen_id: rollenEintrag?.id,
        auth_user_id: data.user?.id,
      },
      { onConflict: 'email' },
    );

    return { data, error: null };
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    user.value = null;
    profile.value = null;
    rolle.value = ROLLEN.TEILNEHMER;
  }

  async function completeOAuthLogin() {
    await initialSessionReady;
    return { data: { user: user.value }, error: null };
  }

  async function updateProfil(payload, teilnehmerRef) {
    if (!profile.value?.id) {
      return { error: new Error('Kein Profil vorhanden.') };
    }

    const { data, error } = await supabase
      .from('teilnehmer')
      .update({
        vorname: payload.vorname,
        nachname: payload.nachname,
        erforderliche_stunden: payload.erforderliche_stunden,
      })
      .eq('id', profile.value.id)
      .select('*, rollen(name)')
      .maybeSingle();

    if (!error && data) {
      profile.value = mapTeilnehmer(data);
      if (teilnehmerRef) {
        const list = teilnehmerRef.value ?? teilnehmerRef;
        const idx = list.findIndex((item) => item.id === data.id);
        if (idx >= 0) {
          list[idx] = mapTeilnehmer(data);
        }
      }
    }

    return { data, error };
  }

  return {
    user,
    profile,
    rolle,
    userEmail,
    userId,
    profilName,
    istAngemeldet,
    istAdmin,
    istOrganisator,
    mapTeilnehmer,
    loadSession,
    fetchProfile,
    handleLogin,
    handleGoogleLogin,
    handleUserRegister,
    handleLogout,
    completeOAuthLogin,
    updateProfil,
  };
});
