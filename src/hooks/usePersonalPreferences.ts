"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PersonalPreferences } from "@/types";

export function usePersonalPreferences(enabled = true) {
  const [preferences, setPreferences] = useState<PersonalPreferences | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    let ignore = false;
    const fetchPreferences = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!ignore) {
          setPreferences(null);
          setLoading(false);
        }
        return;
      }

      const res = await fetch("/api/personal-preferences", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => null);
      if (!ignore) {
        setPreferences(res.ok ? data : null);
        setLoading(false);
      }
    };

    fetchPreferences();
    return () => { ignore = true; };
  }, [enabled]);

  return { preferences, loading };
}
