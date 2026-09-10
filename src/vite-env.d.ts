/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PAYMENTS?: string;
  readonly VITE_KKIAPAY_PUBLIC_KEY?: string;
  readonly VITE_KKIAPAY_SANDBOX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
