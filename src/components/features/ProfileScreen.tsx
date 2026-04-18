"use client";
import { CONCERNS } from "@/lib/constants";
import type { UserProfile } from "@/types";

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onComplete: () => void;
}

const AGE_OPTS    = ["10代","20代前半","20代後半","30代前半","30代後半","40代","50代以上"];
const SKIN_OPTS   = ["乾燥肌","脂性肌","混合肌","敏感肌","普通肌"];
const HAIR_OPTS   = ["細め・柔らか","普通","剛毛・硬め","くせ毛","カラー毛","パーマ毛"];

function PillGroup({
  options, value, onChange, multi,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (o: string) =>
    multi ? (value as string[]).includes(o) : value === o;

  return (
    <div className="flex flex-wrap">
      {options.map((o) => (
        <span key={o} onClick={() => onChange(o)}
          className="inline-flex px-3 py-1.5 rounded-full text-[12px] m-0.5 cursor-pointer transition-all duration-150 select-none"
          style={{
            fontWeight: isActive(o) ? 700 : 400,
            background: isActive(o) ? "#D4A853" : "rgba(255,255,255,.1)",
            color: isActive(o) ? "#1A0E08" : "rgba(245,238,228,.8)",
            border: `1.5px solid ${isActive(o) ? "#D4A853" : "rgba(255,255,255,.15)"}`,
          }}>
          {o}
        </span>
      ))}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] p-4 mb-3"
      style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}>
      <p className="text-[11px] font-semibold mb-2 tracking-[.5px]" style={{ color: "rgba(212,168,83,.9)" }}>{label}</p>
      {children}
    </div>
  );
}

export default function ProfileScreen({ profile, onChange, onComplete }: Props) {
  const set = (key: keyof UserProfile, val: string) => {
    onChange({ ...profile, [key]: val });
  };
  const toggleConcern = (c: string) => {
    onChange({
      ...profile,
      concerns: profile.concerns.includes(c)
        ? profile.concerns.filter((x) => x !== c)
        : [...profile.concerns, c],
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10"
      style={{ background: "linear-gradient(160deg,#1A0E08 0%,#3D2010 100%)" }}>
      {/* ロゴ */}
      <div className="text-center mb-8">
        <h1 className="text-[34px] italic tracking-[4px] mb-2" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#F5EEE4" }}>
          beauté
        </h1>
        <p className="text-[20px] font-bold mb-1.5" style={{ color: "#F5EEE4" }}>あなただけの美容提案</p>
        <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(245,238,228,.55)" }}>
          肌・髪・悩みを教えてください<br />AIがぴったりのアイテムを選びます
        </p>
      </div>

      <Section label="年齢">
        <PillGroup options={AGE_OPTS} value={profile.age} onChange={(v) => set("age", v)} />
      </Section>
      <Section label="肌タイプ">
        <PillGroup options={SKIN_OPTS} value={profile.skinType} onChange={(v) => set("skinType", v)} />
      </Section>
      <Section label="髪のタイプ">
        <PillGroup options={HAIR_OPTS} value={profile.hairType} onChange={(v) => set("hairType", v)} />
      </Section>
      <Section label="悩み（複数選択可）">
        <PillGroup options={CONCERNS} value={profile.concerns} onChange={toggleConcern} multi />
      </Section>

      <button
        onClick={onComplete}
        className="w-full rounded-[14px] py-3.5 text-[14px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg,#A8722A,#D4A853)" }}>
        提案を見る →
      </button>
      <p onClick={onComplete}
        className="text-center mt-3 text-[12px] cursor-pointer"
        style={{ color: "rgba(245,238,228,.35)" }}>
        スキップ
      </p>
    </div>
  );
}
