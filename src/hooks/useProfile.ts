"use client";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/types";

const KEY = "beaute_profile";
const DEFAULT: UserProfile = { age: "", skinType: "", hairType: "", concerns: [] };

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT);
  const [profileDone, setProfileDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as UserProfile;
      setProfile(parsed);
      if (parsed.age || parsed.skinType) setProfileDone(true);
    }
  }, []);

  const updateProfile = (next: UserProfile) => {
    setProfile(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const completeProfile = () => {
    localStorage.setItem(KEY, JSON.stringify(profile));
    setProfileDone(true);
  };

  return { profile, updateProfile, profileDone, completeProfile };
}
