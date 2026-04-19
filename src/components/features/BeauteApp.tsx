"use client";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ProfileScreen from "./ProfileScreen";
import HomeTab from "./HomeTab";
import SearchTab from "./SearchTab";
import AnalyzeTab from "./AnalyzeTab";
import LogTab from "./LogTab";
import PremiumTab from "./PremiumTab";

type Tab = "home" | "search" | "analyze" | "log" | "premium";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home",    icon: "🏠", label: "ホーム" },
  { id: "search",  icon: "🔍", label: "探す" },
  { id: "analyze", icon: "🧪", label: "解析" },
  { id: "log",     icon: "📓", label: "ログ" },
  { id: "premium", icon: "👑", label: "プラン" },
];

export default function BeauteApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [isPro, setIsPro] = useState(false);
  const [searchInitCat, setSearchInitCat] = useState<string | undefined>();
  const { profile, updateProfile, profileDone, completeProfile } = useProfile();

  const goUpgrade = () => setTab("premium");
  const goSearch  = (cat?: string) => { setSearchInitCat(cat); setTab("search"); };

  if (!profileDone) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <ProfileScreen profile={profile} onChange={updateProfile} onComplete={completeProfile}/>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: "#F8F4EF", minHeight: "100vh", paddingBottom: 80 }}>

      {/* HEADER */}
      <header className="sticky top-0 z-[200] flex items-center justify-between px-5 py-3.5 border-b border-[#EDE5DC]"
        style={{ background: "rgba(248,244,239,.93)", backdropFilter: "blur(14px)" }}>
        <span className="text-[26px] italic font-semibold tracking-[3px]"
          style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
          beauté
        </span>
        <div className="flex items-center gap-2">
          {isPro && <span className="text-[11px] font-semibold" style={{ color: "#A8722A" }}>👑 PRO</span>}
          <button onClick={goUpgrade}
            className="text-[10px] font-bold tracking-[.5px] px-3.5 py-1.5 rounded-full border-none cursor-pointer transition-all duration-200"
            style={isPro
              ? { background: "linear-gradient(135deg,#A8722A,#D4A853)", color: "#fff" }
              : { background: "transparent", border: "1.5px solid #A8722A", color: "#A8722A" }}>
            {isPro ? "PRO加入中" : "FREE → PRO"}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main key={tab} className="fade-up">
        {tab === "home"    && <HomeTab    profile={profile} isPro={isPro} onUpgrade={goUpgrade} onGoSearch={goSearch}/>}
        {tab === "search"  && <SearchTab  isPro={isPro} onUpgrade={goUpgrade} initialCat={searchInitCat}/>}
        {tab === "analyze" && <AnalyzeTab isPro={isPro} onUpgrade={goUpgrade}/>}
        {tab === "log"     && <LogTab/>}
        {tab === "premium" && <PremiumTab isPro={isPro} onUpgrade={() => setIsPro(true)}/>}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 z-[200] flex w-full"
        style={{ maxWidth: 430, left: "50%", transform: "translateX(-50%)", background: "#1A0E08", paddingBottom: 10, paddingTop: 4 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-[3px] pt-2 pb-0 border-none bg-transparent cursor-pointer transition-all duration-200 font-sans"
              style={{ color: active ? "#D4A853" : "rgba(255,255,255,.3)", fontSize: 9, letterSpacing: .3 }}>
              <span className="text-[20px] leading-none"
                style={{ filter: active ? "drop-shadow(0 0 6px rgba(212,168,83,.7))" : "none" }}>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
