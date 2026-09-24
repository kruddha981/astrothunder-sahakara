/**
 * SAHAKARA — Supabase Configuration Manager
 * Handles reading Supabase project credentials securely.
 */

(function () {
  const DEFAULT_CONFIG = {
    API_BASE_URL: 'https://astrothunder-sahakara-1.onrender.com',
    SUPABASE_URL: 'https://kzocpeydfecvopjphcmc.supabase.co',
    SUPABASE_ANON_KEY: 'replace-with-your-supabase-anon-key'
  };

  function getStoredConfig() {
    const localUrl = localStorage.getItem('SAHAKARA_SUPABASE_URL');
    const localKey = localStorage.getItem('SAHAKARA_SUPABASE_ANON_KEY');
    return {
      apiBaseUrl: localStorage.getItem('SAHAKARA_API_BASE_URL') || window.ENV?.API_BASE_URL || DEFAULT_CONFIG.API_BASE_URL,
      url: localUrl || window.ENV?.SUPABASE_URL || DEFAULT_CONFIG.SUPABASE_URL,
      key: localKey || window.ENV?.SUPABASE_ANON_KEY || DEFAULT_CONFIG.SUPABASE_ANON_KEY,
      isCustom: Boolean(localUrl || window.ENV?.SUPABASE_URL)
    };
  }

  function setStoredConfig(url, key) {
    if (url) localStorage.setItem('SAHAKARA_SUPABASE_URL', url.trim());
    if (key) localStorage.setItem('SAHAKARA_SUPABASE_ANON_KEY', key.trim());
  }

  function clearStoredConfig() {
    localStorage.removeItem('SAHAKARA_SUPABASE_URL');
    localStorage.removeItem('SAHAKARA_SUPABASE_ANON_KEY');
  }

  let supabaseClient = null;

  function initSupabase() {
    if (supabaseClient) return supabaseClient;

    const { url, key } = getStoredConfig();

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(url, key);
        console.log('🌱 [Sahakara] Connected to Supabase PostgreSQL & Realtime:', url);
      } catch (err) {
        console.warn('[Sahakara] Failed to initialize Supabase client:', err.message);
      }
    } else {
      console.warn('[Sahakara] Supabase JS SDK not loaded yet.');
    }

    return supabaseClient;
  }

  window.SahakaraConfig = {
    get: getStoredConfig,
    set: setStoredConfig,
    clear: clearStoredConfig,
    getClient: initSupabase
  };
})();
