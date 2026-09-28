/**
 * Mesmo projecto Supabase do LODJA (Bónus Lodja)
 */
const SUPABASE_URL = 'https://edidkxeuoynezvucuwam.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_smygrlH5VZJGtQlv92hPeA_gw8D3wEq';

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('Supabase JS não carregado — modo local activo');
    return null;
  }
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = supabaseClient;
  return supabaseClient;
}
