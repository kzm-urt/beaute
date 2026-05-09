"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { resolveIsPro } from "@/lib/plan";
import type { UserProfile } from "@/types";

const DEFAULT: UserProfile = {
  nickname: "",
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
  skinConcerns: [],
  hairConcerns: [],
  otherConcerns: [],
  avoidIngredients: [],
  allergies: [],
  skinNotes: [],
  hairNotes: [],
  otherNotes: [],
};

const BASE_PROFILE_SELECT = "age, skin_type, hair_type, concerns, is_pro";
const COMPAT_PROFILE_SELECT = [
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
const FULL_PROFILE_SELECT = `nickname,${COMPAT_PROFILE_SELECT}`;
const ENHANCED_PROFILE_SELECT = [
  FULL_PROFILE_SELECT,
  "skin_concerns",
  "hair_concerns",
  "other_concerns",
  "avoid_ingredients",
  "allergies",
  "skin_notes",
  "hair_notes",
  "other_notes",
].join(",");

type ProfileRow = {
  nickname?: string | null;
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
  skin_concerns?: string[] | null;
  hair_concerns?: string[] | null;
  other_concerns?: string[] | null;
  avoid_ingredients?: string[] | null;
  allergies?: string[] | null;
  skin_notes?: string[] | null;
  hair_notes?: string[] | null;
  other_notes?: string[] | null;
  is_pro?: boolean | null;
};

function fromRow(data: ProfileRow): UserProfile {
  return {
    nickname: data.nickname ?? "",
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
    skinConcerns: data.skin_concerns ?? [],
    hairConcerns: data.hair_concerns ?? [],
    otherConcerns: data.other_concerns ?? [],
    avoidIngredients: data.avoid_ingredients ?? [],
    allergies: data.allergies ?? [],
    skinNotes: data.skin_notes ?? [],
    hairNotes: data.hair_notes ?? [],
    otherNotes: data.other_notes ?? [],
  };
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT);
  const [profileDone, setProfileDone] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(DEFAULT);
      setProfileDone(false);
      setProfileLoading(false);
      setIsPro(false);
      setLoadedUserId(null);
      return;
    }

    let ignore = false;
    setProfileLoading(true);
    setLoadedUserId(null);

    const loadProfile = async () => {
      let profileData: ProfileRow | null = null;
      let nextProfile = DEFAULT;
      let nextProfileDone = false;
      let nextIsPro = resolveIsPro(false, userEmail);

      try {
        const enhancedResult = await supabase
          .from("profiles")
          .select(ENHANCED_PROFILE_SELECT)
          .eq("id", userId)
          .single();
        profileData = enhancedResult.data as ProfileRow | null;

        if (!profileData) {
          const fullResult = await supabase
          .from("profiles")
          .select(FULL_PROFILE_SELECT)
          .eq("id", userId)
          .single();
          profileData = fullResult.data as ProfileRow | null;
        }

        if (!profileData) {
          const compat = await supabase
            .from("profiles")
            .select(COMPAT_PROFILE_SELECT)
            .eq("id", userId)
            .single();
          profileData = compat.data as ProfileRow | null;
        }

        if (!profileData) {
          const fallback = await supabase
            .from("profiles")
            .select(BASE_PROFILE_SELECT)
            .eq("id", userId)
            .single();
          profileData = fallback.data as ProfileRow | null;
        }

        if (profileData) {
          nextProfile = fromRow(profileData);
          nextIsPro = resolveIsPro(profileData.is_pro, userEmail);
          nextProfileDone = Boolean(nextProfile.age || nextProfile.skinType);
        }
      } finally {
        if (!ignore) {
          setProfile(nextProfile);
          setIsPro(nextIsPro);
          setProfileDone(nextProfileDone);
          setLoadedUserId(userId);
          setProfileLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      ignore = true;
    };
  }, [userId, userEmail]);

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
    const richPayload = {
      ...basePayload,
      gender: next.gender,
      current_products: next.currentProducts,
      current_state: next.currentState,
      desired_ingredients: next.desiredIngredients,
      beauty_habits: next.habits,
      beauty_goals: next.goals,
    };
    const enhancedPayload = {
      ...richPayload,
      nickname: next.nickname,
      skin_concerns: next.skinConcerns ?? [],
      hair_concerns: next.hairConcerns ?? [],
      other_concerns: next.otherConcerns ?? [],
      avoid_ingredients: next.avoidIngredients ?? [],
      allergies: next.allergies ?? [],
      skin_notes: next.skinNotes ?? [],
      hair_notes: next.hairNotes ?? [],
      other_notes: next.otherNotes ?? [],
    };
    const { error } = await supabase.from("profiles").upsert(enhancedPayload);

    if (error) {
      const compat = await supabase.from("profiles").upsert({
        ...richPayload,
        nickname: next.nickname,
      });
      if (compat.error) {
        await supabase.from("profiles").upsert(basePayload);
      }
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
    const enhancedResult = await supabase
      .from("profiles")
      .select(ENHANCED_PROFILE_SELECT)
      .eq("id", user.id)
      .single();
    profileData = enhancedResult.data as ProfileRow | null;
    if (!profileData) {
      const fullResult = await supabase
      .from("profiles")
      .select(FULL_PROFILE_SELECT)
      .eq("id", user.id)
      .single();
      profileData = fullResult.data as ProfileRow | null;
    }
    if (!profileData) {
      const compat = await supabase
        .from("profiles")
        .select(COMPAT_PROFILE_SELECT)
        .eq("id", user.id)
        .single();
      profileData = compat.data as ProfileRow | null;
    }
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
      const nextProfile = fromRow(profileData);
      setProfile(nextProfile);
      setProfileDone(Boolean(nextProfile.age || nextProfile.skinType));
      setLoadedUserId(user.id);
    }
  };

  const effectiveProfileLoading = profileLoading || Boolean(user && loadedUserId !== user.id);

  return { profile, updateProfile, profileDone, setProfileDone, completeProfile, profileLoading: effectiveProfileLoading, isPro, setIsPro, refreshProfile };
}
