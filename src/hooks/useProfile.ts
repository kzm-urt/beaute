"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { resolveIsPro } from "@/lib/plan";
import type { UserProfile } from "@/types";

const DEFAULT: UserProfile = { age: "", skinType: "", hairType: "", concerns: [] };

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT);
  const [profileDone, setProfileDone] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT);
      setProfileDone(false);
      setProfileLoading(false);
      setIsPro(false);
      return;
    }

    supabase
      .from("profiles")
      .select("age, skin_type, hair_type, concerns, is_pro")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p: UserProfile = {
            age: data.age ?? "",
            skinType: data.skin_type ?? "",
            hairType: data.hair_type ?? "",
            concerns: data.concerns ?? [],
          };
          setProfile(p);
          setIsPro(resolveIsPro(data.is_pro, user.email));
          if (p.age || p.skinType) setProfileDone(true);
        }
        setProfileLoading(false);
      });
  }, [user]);

  const updateProfile = async (next: UserProfile) => {
    setProfile(next);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      age: next.age,
      skin_type: next.skinType,
      hair_type: next.hairType,
      concerns: next.concerns,
      updated_at: new Date().toISOString(),
    });
  };

  const completeProfile = async () => {
    setProfileDone(true);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      age: profile.age,
      skin_type: profile.skinType,
      hair_type: profile.hairType,
      concerns: profile.concerns,
      updated_at: new Date().toISOString(),
    });
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("age, skin_type, hair_type, concerns, is_pro")
      .eq("id", user.id)
      .single();
    if (data) {
      setIsPro(resolveIsPro(data.is_pro, user.email));
      setProfile({
        age: data.age ?? "",
        skinType: data.skin_type ?? "",
        hairType: data.hair_type ?? "",
        concerns: data.concerns ?? [],
      });
    }
  };

  return { profile, updateProfile, profileDone, setProfileDone, completeProfile, profileLoading, isPro, setIsPro, refreshProfile };
}
