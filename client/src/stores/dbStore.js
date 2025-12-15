import { defineStore } from 'pinia';
import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const useDbStore = defineStore('dbStore', () => {
  const user = ref(supabase.auth.getUser()); // Placeholder user
  const events = ref([]);
  const workshops = ref([]);

  const handleLogin = async (email, password) => {
    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Error loggin in: ', error);
    } else {
      user.value = user;
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

  return { user, events, workshops, fetchEvents, fetchWorkshops, handleLogin };
});
