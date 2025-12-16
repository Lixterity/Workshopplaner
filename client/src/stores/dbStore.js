import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const useDbStore = defineStore('dbStore', () => {
  const router = useRouter();
  const user = ref({});
  const events = ref([]);
  const workshops = ref([]);

  const handleLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      console.error('Error loggin in: ', error);
    } else {
      user.value = data.user;
      router.push('/events');
    }
    return { data, error };
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error logging in with Google: ', error);
      return;
    }
    if (user.value != {}) {
      user.value = data.user;
    }
    await router.push('/events');
    return { data, error };
  };

  const handleUserRegister = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: username,
        },
      },
    });
    if (error) {
      console.error('Error registering user: ', error);
    } else {
      user.value = data.user;
      router.push('/events');
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('event').select('*');
    if (error) {
      console.error('Error fetching data:', error);
    } else {
      events.value = data;
    }
  };

  const fetchWorkshops = async () => {
    const { data, error } = await supabase.from('workshop').select('*');

    if (error) console.error('Error fetching workshops:', error);

    workshops.value = data;
  };

  return {
    user,
    events,
    workshops,
    fetchEvents,
    fetchWorkshops,
    handleLogin,
    handleGoogleLogin,
    handleUserRegister,
  };
});
