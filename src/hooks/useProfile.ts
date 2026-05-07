"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { resolveIsPro } from "@/lib/plan";
import type { UserProfile } from "@/types";

const DEFAULT: UserProfile = {
  age: "",
  gender: "",
  skinType: "",
  hairType: "",
  concerns: [],
  currentProducts: [],
  currentState: [],
  desiredIngredients: [],
  habits: [],
  goals: [],
};

const BASE_PROFILE_SELECT = "age, skin_type, hair_type, concerns, is_pro";
const FULL_PROFILE_SELECT = [
  "age",
  "gender",
  "skin_type",
  "hair_type",
  "concerns",
  "current_products",
  "current_state",
  "desired_ingredients",
  "beauty_habits",
  "beauty_goals",
  "is_pro",
].join(",");

type ProfileRow = {
  age?: string | null;
  gender?: string | null;
  skin_type?: string | null;
  hair_type?: string | null;
  concerns?: string[] | null;
  current_products?: string[] | null;
  current_state?: string[] | null;
  desired_ingredients?: string[] | null;
  beauty_habits?: string[] | null;
  beauty_goals?: string[] | null;
  is_pro?: boolean | null;
};

function fromRow(data: ProfileRow): UserProfile {
  return {
    age: data.age ?? "",
    gender: data.gender ?? "",
    skinType: data.skin_type ?? "",
    hairType: data.hair_type ?? "",
    concerns: data.concerns ?? [],
    currentProducts: data.current_products ?? [],
    currentState: data.current_state ?? [],
    desiredIngredients: data.desired_ingredients ?? [],
    habits: data.beauty_habits ?? [],
    goals: data.beauty_goals ?? [],
  };
}

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

    const loadProfile = async () => {
      let profileData: ProfileRow | null = null;
      const fullResult = await supabase
        .from("profiles")
        .select(FULL_PROFILE_SELECT)
        .eq("id", user.id)
        .single();
      profileData = fullResult.data as ProfileRow | null;

      if (!profileData) {
        const fallback = await supabase
          .from("profiles")
          .select(BASE_PROFILE_SELECT)
          .eq("id", user.id)
          .single();
        profileData = fallback.data as ProfileRow | null;
      }

      if (profileData) {
        const p = fromRow(profileData);
        setProfile(p);
        setIsPro(resolveIsPro(profileData.is_pro, user.email));
        if (p.age || p.skinType) setProfileDone(true);
      }
      setProfileLoading(false);
    };

    void loadProfile();
  }, [user]);

  const saveProfile = async (next: UserProfile) => {
    if (!user) return;
    const basePayload = {
      id: user.id,
      age: next.age,
      skin_type: next.skinType,
      hair_type: next.hairType,
      concerns: next.concerns,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert({
      ...basePayload,
      gender: next.gender,
      current_products: next.currentProducts,
      current_state: next.currentState,
      desired_ingredients: next.desiredIngredients,
      beauty_habits: next.habits,
      beauty_goals: next.goals,
    });

    if (error) {
      await supabase.from("profiles").upsert(basePayload);
    }
  };

  const updateProfile = async (next: UserProfile) => {
    setProfile(next);
    await saveProfile(next);
  };

  const completeProfile = async () => {
    setProfileDone(true);
    await saveProfile(profile);
  };

  const refreshProfile = async () => {
    if (!user) return;
    let profileData: ProfileRow | null = null;
    const fullResult = await supabase
      .from("profiles")
      .select(FULL_PROFILE_SELECT)
      .eq("id", user.id)
      .single();
    profileData = fullResult.data as ProfileRow | null;
    if (!profileData) {
      const fallback = await supabase
        .from("profiles")
        .select(BASE_PROFILE_SELECT)
        .eq("id", user.id)
        .single();
      profileData = fallback.data as ProfileRow | null;
    }
    if (profileData) {
      setIsPro(resolveIsPro(profileData.is_pro, user.email));
      setProfile(fromRow(profileData));
    }
  };

  return { profile, updateProfile, profileDone, setProfileDone, completeProfile, profileLoading, isPro, setIsPro, refreshProfile };
}
