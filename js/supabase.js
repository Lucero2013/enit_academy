import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabase = createClient(
  "https://iuhhoqmiyndltxcxiiud.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aGhvcW1peW5kbHR4Y3hpaXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTEwOTYsImV4cCI6MjA5NjUyNzA5Nn0.Tu0aBSMIzl2b8SO_R4I1MelLpDecIxYirkvbbYW_fsE",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);