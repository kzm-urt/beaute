"use client";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui";
import type { UserProfile } from "@/types";

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onComplete: () => void;
}

const AGE_OPTS = ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代", "50代以上"];
const GENDER_OPTS = ["女性", "男性", "ノンバイナリー", "回答しない"];
const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌", "まだわからない"];
const HAIR_TYPES = ["細め・柔らか", "普通", "剛毛・硬め", "くせ毛", "カラー毛", "パーマ毛", "ブリーチ毛", "まだわからない"];

const SKIN_CONCERNS = ["乾燥", "毛穴", "くすみ", "ニキビ", "赤み", "ざらつき", "皮脂", "ハリ不足", "小じわ", "メイク崩れ", "ゆらぎ", "シミ・そばかす"];
const SKIN_STATE = ["朝は乾く", "夕方テカる", "赤みが出る", "ざらつく", "メイクが浮く", "毛穴落ちする", "刺激を感じやすい", "季節で変わる"];
const HAIR_CONCERNS = ["うねり", "広がる", "パサつく", "ダメージ毛", "抜け毛が気になる", "頭皮のかゆみ", "ぺたんこ", "カラーの褪色", "まとまらない"];
const OTHER_CONCERNS = ["ボディの乾燥", "手荒れ", "香り選び", "ネイルの弱さ", "サプリも見たい", "時短したい", "コスパ重視", "ギフト用も探す"];
const DESIRED_INGREDIENTS = ["ナイアシンアミド", "セラミド", "ビタミンC", "レチノール", "CICA", "ヒアルロン酸", "ペプチド", "コラーゲン", "鉄分", "アミノ酸"];
const HABITS = ["毎日UV", "朝洗顔", "夜レチノール", "週2パック", "アイロン毎日", "外回り多め", "睡眠不足", "運動少なめ", "マスク時間長め"];
const GOALS = ["毛穴を目立たせない", "肌荒れを減らす", "透明感", "ツヤを出す", "皮脂コントロール", "髪をまとめる", "時短", "コスパ重視"];
const AVOID_INGREDIENTS = ["香り強め", "アルコール感", "メントール", "スクラブ強め", "高濃度レチノール", "強いピーリング", "白浮きしやすいUV", "ベタつき"];
const ALLERGY_MEMOS = ["金属", "ラテックス", "ナッツ由来", "小麦由来", "特定の香料", "精油", "過去にかゆみ", "過去に赤み"];

const CATEGORIZED_CONCERN_OPTIONS = [
  ...SKIN_CONCERNS,
  ...HAIR_CONCERNS,
  ...OTHER_CONCERNS,
];

type ListKey =
  | "concerns"
  | "currentProducts"
  | "currentState"
  | "desiredIngredients"
  | "habits"
  | "goals"
  | "skinConcerns"
  | "hairConcerns"
  | "otherConcerns"
  | "avoidIngredients"
  | "allergies"
  | "skinNotes"
  | "hairNotes"
  | "otherNotes";

function unique(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter((item, index, values) => item && values.indexOf(item) === index)
    .slice(0, 24);
}

function getList(profile: UserProfile, key: ListKey) {
  return (profile[key] ?? []) as string[];
}

function deriveConcerns(next: UserProfile) {
  const legacy = (next.concerns ?? []).filter((item) => !CATEGORIZED_CONCERN_OPTIONS.includes(item));
  return unique([
    ...legacy,
    ...(next.skinConcerns ?? []),
    ...(next.hairConcerns ?? []),
    ...(next.otherConcerns ?? []),
  ]);
}

function PillGroup({
  options,
  value,
  onChange,
  multi,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (option: string) => multi ? (value as string[]).includes(option) : value === option;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = isActive(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="min-h-[34px] rounded-full px-3 text-[12px] transition-all duration-150"
            style={{
              fontWeight: active ? 900 : 700,
              background: active ? "#D4A853" : "rgba(255,255,255,.08)",
              color: active ? "#1A0E08" : "rgba(245,238,228,.84)",
              border: `1.5px solid ${active ? "#D4A853" : "rgba(255,255,255,.16)"}`,
              boxShadow: active ? "0 8px 18px rgba(212,168,83,.18)" : "none",
              cursor: "pointer",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Section({ label, note, children, compact }: {
  label: string;
  note?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className="rounded-[14px]"
      style={{
        padding: compact ? "14px" : "16px",
        background: "rgba(255,255,255,.055)",
        border: "1px solid rgba(255,255,255,.12)",
      }}
    >
      <p className="text-[11px] font-black tracking-[.08em]" style={{ color: "#D4A853", margin: 0 }}>{label}</p>
      {note && <p className="text-[11px] leading-[1.65] mt-1 mb-3" style={{ color: "rgba(245,238,228,.54)" }}>{note}</p>}
      {!note && <div style={{ height: 10 }} />}
      {children}
    </section>
  );
}

function splitListText(value: string) {
  return unique(value.split(/[\n,、]/));
}

function TextListEditor({ value, onChange, placeholder, minHeight = 104 }: {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  minHeight?: number;
}) {
  const [text, setText] = useState(value.join("\n"));

  useEffect(() => {
    setText(value.join("\n"));
  }, [value]);

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(splitListText(text))}
      placeholder={placeholder}
      className="w-full resize-none rounded-[12px] px-3.5 py-3 text-[12px] leading-[1.65] outline-none"
      style={{
        minHeight,
        color: "#F5EEE4",
        background: "rgba(255,255,255,.07)",
        border: "1.5px solid rgba(255,255,255,.16)",
        fontFamily: "inherit",
      }}
    />
  );
}

function GroupTitle({ no, title, body }: { no: string; title: string; body: string }) {
  return (
    <div style={{ margin: "10px 0 2px" }}>
      <div style={{ fontSize: 10, letterSpacing: ".22em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>{no}</div>
      <h3 style={{ margin: 0, color: "#F5EEE4", fontSize: 19, lineHeight: 1.35 }}>{title}</h3>
      <p style={{ margin: "5px 0 0", color: "rgba(245,238,228,.58)", fontSize: 12, lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}

export default function ProfileScreen({ profile, onChange, onComplete }: Props) {
  const set = (key: keyof UserProfile, val: string) => onChange({ ...profile, [key]: val });
  const setList = (key: ListKey, value: string[]) => {
    const next = { ...profile, [key]: unique(value) };
    if (key === "skinConcerns" || key === "hairConcerns" || key === "otherConcerns") {
      next.concerns = deriveConcerns(next);
    }
    onChange(next);
  };
  const toggleList = (key: ListKey, value: string) => {
    const current = getList(profile, key);
    setList(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const signalCount =
    [profile.nickname, profile.age, profile.gender, profile.skinType, profile.hairType].filter(Boolean).length +
    getList(profile, "skinConcerns").length +
    getList(profile, "hairConcerns").length +
    getList(profile, "otherConcerns").length +
    getList(profile, "currentProducts").length +
    getList(profile, "currentState").length +
    getList(profile, "desiredIngredients").length +
    getList(profile, "habits").length +
    getList(profile, "goals").length +
    getList(profile, "avoidIngredients").length +
    getList(profile, "allergies").length +
    getList(profile, "skinNotes").length +
    getList(profile, "hairNotes").length +
    getList(profile, "otherNotes").length;
  const completion = Math.min(100, Math.round((signalCount / 36) * 100));

  return (
    <div
      className="min-h-screen px-5 py-8"
      style={{
        background: "radial-gradient(circle at 20% 0%, rgba(212,168,83,.16), transparent 34%), linear-gradient(160deg,#1A0E08 0%,#32180D 62%,#1A0E08 100%)",
      }}
    >
      <div className="mx-auto grid gap-5 md:grid-cols-[0.72fr_1.28fr]" style={{ maxWidth: 1180 }}>
        <aside className="flex flex-col justify-between rounded-[18px] p-6" style={{ border: "1px solid rgba(212,168,83,.22)", background: "rgba(21,11,0,.42)" }}>
          <div>
            <BrandLogo size="lg" style={{ marginBottom: 20 }} />
            <p className="text-[12px] tracking-[.24em] font-bold mb-3" style={{ color: "#D4A853" }}>パーソナル設定</p>
            <h2 className="text-[28px] md:text-[34px] leading-[1.25] font-black mb-4" style={{ color: "#F5EEE4" }}>
              肌・髪・注意点を、<br/>分けて残しましょう。
            </h2>
            <p className="text-[13px] leading-[1.9]" style={{ color: "rgba(245,238,228,.66)" }}>
              最初は全部入れなくて大丈夫です。わかるところだけ選ぶと、あとで相談しやすくなります。
            </p>
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(245,238,228,.68)", marginBottom: 8 }}>
              <span>登録したメモ</span>
              <strong style={{ color: "#D4A853" }}>{signalCount} / 36</strong>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#A8722A,#D4A853)" }} />
            </div>
            <div style={{ marginTop: 16, border: "1px solid rgba(212,168,83,.24)", borderRadius: 14, padding: 14, background: "rgba(212,168,83,.08)" }}>
              <p style={{ margin: 0, color: "#D4A853", fontSize: 11, letterSpacing: ".14em", fontWeight: 900 }}>注意メモ</p>
              <p style={{ margin: "6px 0 0", color: "rgba(245,238,228,.72)", fontSize: 12, lineHeight: 1.75 }}>
                アレルギーや避けたい成分は診断ではなく、商品を見る前のメモとして使います。
              </p>
            </div>
          </div>
        </aside>

        <main className="rounded-[18px] p-4 md:p-5" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 22px 70px rgba(0,0,0,.22)" }}>
          <div className="grid gap-3">
            <Section label="ニックネーム" note="パーソナル内の声かけに使います。" compact>
              <input
                value={profile.nickname}
                onChange={(e) => set("nickname", e.target.value)}
                placeholder="例）うらさん"
                className="w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
                maxLength={18}
                style={{
                  color: "#F5EEE4",
                  background: "rgba(255,255,255,.07)",
                  border: "1.5px solid rgba(255,255,255,.16)",
                  fontFamily: "inherit",
                }}
              />
            </Section>

            <div className="grid gap-3 md:grid-cols-2">
              <Section label="年齢" compact>
                <PillGroup options={AGE_OPTS} value={profile.age} onChange={(value) => set("age", value)} />
              </Section>
              <Section label="性別" compact>
                <PillGroup options={GENDER_OPTS} value={profile.gender} onChange={(value) => set("gender", value)} />
              </Section>
            </div>

            <GroupTitle no="01" title="肌のこと" body="肌タイプ、今の状態、肌だけのメモを分けて残します。" />
            <div className="grid gap-3 md:grid-cols-2">
              <Section label="肌タイプ" compact>
                <PillGroup options={SKIN_TYPES} value={profile.skinType} onChange={(value) => set("skinType", value)} />
              </Section>
              <Section label="肌の悩み" note="複数OK。" compact>
                <PillGroup options={SKIN_CONCERNS} value={getList(profile, "skinConcerns")} onChange={(value) => toggleList("skinConcerns", value)} multi />
              </Section>
              <Section label="今日・最近の肌" note="変化しやすいもの。" compact>
                <PillGroup options={SKIN_STATE} value={getList(profile, "currentState")} onChange={(value) => toggleList("currentState", value)} multi />
              </Section>
              <Section label="肌メモ" note="部位、季節、使って合ったものなど。">
                <TextListEditor
                  value={getList(profile, "skinNotes")}
                  onChange={(items) => setList("skinNotes", items)}
                  placeholder={"例)\n頬だけ乾く\n春は赤みが出やすい\n朝は軽めが好き"}
                />
              </Section>
            </div>

            <GroupTitle no="02" title="髪のこと" body="髪質と頭皮、カラーやダメージを肌と混ぜずに扱います。" />
            <div className="grid gap-3 md:grid-cols-2">
              <Section label="髪タイプ" compact>
                <PillGroup options={HAIR_TYPES} value={profile.hairType} onChange={(value) => set("hairType", value)} />
              </Section>
              <Section label="髪・頭皮の悩み" note="複数OK。" compact>
                <PillGroup options={HAIR_CONCERNS} value={getList(profile, "hairConcerns")} onChange={(value) => toggleList("hairConcerns", value)} multi />
              </Section>
              <Section label="髪メモ" note="長さ、カラー履歴、苦手な仕上がりなど。">
                <TextListEditor
                  value={getList(profile, "hairNotes")}
                  onChange={(items) => setList("hairNotes", items)}
                  placeholder={"例)\nブリーチ1回\n湿気で広がる\n重いオイルは苦手"}
                />
              </Section>
              <Section label="使っている製品" note="スキンケアもヘアケアも1行に1つ。">
                <TextListEditor
                  value={getList(profile, "currentProducts")}
                  onChange={(items) => setList("currentProducts", items)}
                  placeholder={"例)\n肌ラボ 極潤\nアネッサ 日焼け止め\nフィーノ ヘアマスク"}
                />
              </Section>
            </div>

            <GroupTitle no="03" title="その他・好きな選び方" body="ボディ、香り、サプリ、予算や続け方をここへ。" />
            <div className="grid gap-3 md:grid-cols-2">
              <Section label="その他の気になること" note="複数OK。" compact>
                <PillGroup options={OTHER_CONCERNS} value={getList(profile, "otherConcerns")} onChange={(value) => toggleList("otherConcerns", value)} multi />
              </Section>
              <Section label="欲しい成分" note="検索の目印。" compact>
                <PillGroup options={DESIRED_INGREDIENTS} value={getList(profile, "desiredIngredients")} onChange={(value) => toggleList("desiredIngredients", value)} multi />
              </Section>
              <Section label="習慣" note="続けやすさを見るため。" compact>
                <PillGroup options={HABITS} value={getList(profile, "habits")} onChange={(value) => toggleList("habits", value)} multi />
              </Section>
              <Section label="目標" note="今日の選び方に使います。" compact>
                <PillGroup options={GOALS} value={getList(profile, "goals")} onChange={(value) => toggleList("goals", value)} multi />
              </Section>
              <Section label="その他メモ" note="予算、香り、生活リズムなど。">
                <TextListEditor
                  value={getList(profile, "otherNotes")}
                  onChange={(items) => setList("otherNotes", items)}
                  placeholder={"例)\n3,000円以内がうれしい\n強い香りは苦手\n朝は時間がない"}
                />
              </Section>
            </div>

            <GroupTitle no="04" title="避けたいもの・アレルギー" body="商品を見る前に気をつけたいもの。医療判断ではなくメモとして扱います。" />
            <div className="grid gap-3 md:grid-cols-2">
              <Section label="避けたい質感・成分" note="複数OK。" compact>
                <PillGroup options={AVOID_INGREDIENTS} value={getList(profile, "avoidIngredients")} onChange={(value) => toggleList("avoidIngredients", value)} multi />
              </Section>
              <Section label="アレルギー・刺激メモ" note="思い当たるものだけ。" compact>
                <PillGroup options={ALLERGY_MEMOS} value={getList(profile, "allergies")} onChange={(value) => toggleList("allergies", value)} multi />
              </Section>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button
              onClick={onComplete}
              className="w-full rounded-[14px] py-3.5 text-[14px] font-black border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#A8722A,#D4A853)", color: "#1A0E08" }}
            >
              この内容で始める →
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-[12px] py-2.5 text-[12px] font-bold cursor-pointer"
              style={{ color: "rgba(245,238,228,.58)", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)" }}
            >
              あとで細かく足す
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
