import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ROLLEN = Object.freeze({
  TEILNEHMER: 'TEILNEHMER',
  ORGANISATOR: 'ORGANISATOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
});

export function normalizeRolle(rolleName) {
  if (!rolleName || typeof rolleName !== 'string') {
    return ROLLEN.TEILNEHMER;
  }
  const upper = rolleName.trim().toUpperCase();
  if (upper === ROLLEN.ADMINISTRATOR) return ROLLEN.ADMINISTRATOR;
  if (upper === ROLLEN.ORGANISATOR) return ROLLEN.ORGANISATOR;
  return ROLLEN.TEILNEHMER;
}
