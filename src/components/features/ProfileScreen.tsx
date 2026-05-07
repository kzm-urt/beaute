"use client";
import { useEffect, useState } from "react";
import { CONCERNS } from "@/lib/constants";
import type { UserProfile } from "@/types";

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onComplete: () => void;
}

const AGE_OPTS = ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代", "50代以上"];
const GENDER_OPTS = ["女性", "男性", "ノンバイナリー", "回答しない"];
const SKIN_OPTS = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌"];
const HAIR_OPTS = ["細め・柔らか", "普通", "剛毛・硬め", "くせ毛", "カラー毛", "パーマ毛"];
const CURRENT_STATE_OPTS = ["朝は乾く", "夕方テカる", "赤みが出る", "ざらつく", "メイクが浮く", "毛穴落ちする", "抜け毛が気になる", "髪が広がる"];
const DESIRED_INGREDIENT_OPTS = ["ナイアシンアミド", "セラミド", "ビタミンC", "レチノール", "CICA", "ヒアルロン酸", "ペプチド", "コラーゲン", "鉄分"];
const HABIT_OPTS = ["毎日UV", "朝洗顔", "夜レチノール", "週2パック", "アイロン毎日", "外回り多め", "睡眠不足", "運動少なめ"];
const GOAL_OPTS = ["毛穴を目立たせない", "肌荒れを減らす", "透明感", "ツヤを出す", "皮脂コントロール", "髪をまとめる", "時短", "コスパ重視"];

const DETAIL_GROUPS = [
  {
    label: "今日の肌状態",
    note: "同じ肌タイプでも、今日のコンディションで候補を変えます。",
    options: ["朝は乾く", "夕方テカる", "赤みが出る", "ざらつく", "メイクが浮く", "毛穴落ちする"],
    multi: true,
  },
  {
    label: "好きな仕上がり",
    note: "質感の好みまで入れると、買った後の違和感を減らせます。",
    options: ["さっぱり", "しっとり", "ツヤ", "セミマット", "カバー重視", "軽さ重視"],
    multi: false,
  },
  {
    label: "使うタイミング",
    note: "朝向け・夜向け・持ち歩きでおすすめを分けます。",
    options: ["朝用", "夜用", "メイク前", "外出先", "週末ケア"],
    multi: false,
  },
  {
    label: "予算感",
    note: "無料では参考情報、PROでは価格帯とレビュー密度で並び替えます。",
    options: ["〜1,500円", "〜3,000円", "〜5,000円", "5,000円以上", "コスパ重視"],
    multi: false,
  },
  {
    label: "避けたいもの",
    note: "苦手な使用感や成分傾向を外して、候補のノイズを減らします。",
    options: ["香り強めNG", "ベタつきNG", "アルコール感NG", "白浮きNG", "刺激感NG"],
    multi: true,
  },
];

function PillGroup({ options, value, onChange, multi }: {
  options: string[];
  value: string | string[];
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (o: string) => multi ? (value as string[]).includes(o) : value === o;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = isActive(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
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
            {o}
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <p className="text-[11px] font-black tracking-[.08em]" style={{ color: "#D4A853", margin: 0 }}>{label}</p>
          {note && <p className="text-[11px] leading-[1.65] mt-1" style={{ color: "rgba(245,238,228,.54)", marginBottom: 0 }}>{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function splitListText(value: string) {
  return value
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter((item, index, values) => item && values.indexOf(item) === index)
    .slice(0, 12);
}

function TextListEditor({ value, onChange, placeholder }: {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
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
        minHeight: 108,
        color: "#F5EEE4",
        background: "rgba(255,255,255,.07)",
        border: "1.5px solid rgba(255,255,255,.16)",
        fontFamily: "inherit",
      }}
    />
  );
}

export default function ProfileScreen({ profile, onChange, onComplete }: Props) {
  const set = (key: keyof UserProfile, val: string) => onChange({ ...profile, [key]: val });
  const setList = (key: keyof UserProfile, value: string[]) => onChange({ ...profile, [key]: value });
  const toggleList = (key: keyof UserProfile, value: string) => {
    const current = profile[key] as string[];
    onChange({
      ...profile,
      [key]: current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value],
    });
  };
  const toggleConcern = (c: string) => {
    onChange({
      ...profile,
      concerns: profile.concerns.includes(c)
        ? profile.concerns.filter((x) => x !== c)
        : [...profile.concerns, c],
    });
  };
  const setDetail = (options: string[], value: string, multi?: boolean) => {
    if (multi) {
      toggleConcern(value);
      return;
    }
    onChange({
      ...profile,
      concerns: [...profile.concerns.filter((x) => !options.includes(x)), value],
    });
  };

  const signalCount =
    [profile.age, profile.gender, profile.skinType, profile.hairType].filter(Boolean).length +
    profile.concerns.length +
    profile.currentProducts.length +
    profile.currentState.length +
    profile.desiredIngredients.length +
    profile.habits.length +
    profile.goals.length;
  const completion = Math.min(100, Math.round((signalCount / 24) * 100));

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
            <h1 className="text-[36px] italic tracking-[4px] mb-5" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#F5EEE4" }}>
              beauté
            </h1>
            <p className="text-[12px] tracking-[.24em] font-bold mb-3" style={{ color: "#D4A853" }}>PERSONAL BEAUTY MAP</p>
            <h2 className="text-[28px] md:text-[34px] leading-[1.25] font-black mb-4" style={{ color: "#F5EEE4" }}>
              細かく答えるほど、<br/>買う理由が見える。
            </h2>
            <p className="text-[13px] leading-[1.9]" style={{ color: "rgba(245,238,228,.66)" }}>
              まずは無料で基本提案。PROでは、ここで選んだ細かい条件と保存・ログを使って、商品ごとの相性スコアと理由を出します。
            </p>
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(245,238,228,.68)", marginBottom: 8 }}>
              <span>診断シグナル</span>
              <strong style={{ color: "#D4A853" }}>{signalCount} / 24</strong>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#A8722A,#D4A853)" }} />
            </div>
            <div style={{ marginTop: 16, border: "1px solid rgba(212,168,83,.24)", borderRadius: 14, padding: 14, background: "rgba(212,168,83,.08)" }}>
              <p style={{ margin: 0, color: "#D4A853", fontSize: 11, letterSpacing: ".14em", fontWeight: 900 }}>PRO PREVIEW</p>
              <p style={{ margin: "6px 0 0", color: "rgba(245,238,228,.72)", fontSize: 12, lineHeight: 1.75 }}>
                回答が14個以上あると、PROで「相性スコア」「避けたい条件」「購入前チェック」「動画での使い方」まで細かく表示できます。
              </p>
            </div>
          </div>
        </aside>

        <main className="rounded-[18px] p-4 md:p-5" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 22px 70px rgba(0,0,0,.22)" }}>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Section label="年齢" compact>
                <PillGroup options={AGE_OPTS} value={profile.age} onChange={(v) => set("age", v)} />
              </Section>
              <Section label="性別" compact>
                <PillGroup options={GENDER_OPTS} value={profile.gender} onChange={(v) => set("gender", v)} />
              </Section>
              <Section label="肌タイプ" compact>
                <PillGroup options={SKIN_OPTS} value={profile.skinType} onChange={(v) => set("skinType", v)} />
              </Section>
            </div>

            <Section label="髪のタイプ">
              <PillGroup options={HAIR_OPTS} value={profile.hairType} onChange={(v) => set("hairType", v)} />
            </Section>

            <Section label="いま気になる悩み" note="複数選択できます。無料提案でもここは強く効きます。">
              <PillGroup options={CONCERNS} value={profile.concerns} onChange={toggleConcern} multi />
            </Section>

            <Section label="使っている製品" note="商品名・ブランド名を入れると、買い替え候補や相性の比較に使えます。1行に1つずつ入力できます。">
              <TextListEditor
                value={profile.currentProducts}
                onChange={(items) => setList("currentProducts", items)}
                placeholder={"例)\n肌ラボ 極潤\nアネッサ 日焼け止め\nフィーノ ヘアマスク"}
              />
            </Section>

            <div className="grid gap-3 md:grid-cols-2">
              <Section label="今の状態" note="今日〜最近の状態を入れると、次にやるケアが具体的になります。" compact>
                <PillGroup options={CURRENT_STATE_OPTS} value={profile.currentState} onChange={(v) => toggleList("currentState", v)} multi />
              </Section>
              <Section label="欲しい成分" note="成分名から商品と動画を引っ張ります。" compact>
                <PillGroup options={DESIRED_INGREDIENT_OPTS} value={profile.desiredIngredients} onChange={(v) => toggleList("desiredIngredients", v)} multi />
              </Section>
              <Section label="習慣" note="使い方・生活リズムまで見ると、現実的な提案になります。" compact>
                <PillGroup options={HABIT_OPTS} value={profile.habits} onChange={(v) => toggleList("habits", v)} multi />
              </Section>
              <Section label="目標" note="最終的にどう見せたいかをおすすめに反映します。" compact>
                <PillGroup options={GOAL_OPTS} value={profile.goals} onChange={(v) => toggleList("goals", v)} multi />
              </Section>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {DETAIL_GROUPS.map((group) => (
                <Section key={group.label} label={group.label} note={group.note} compact>
                  <PillGroup
                    options={group.options}
                    value={group.multi ? profile.concerns : group.options.find((o) => profile.concerns.includes(o)) ?? ""}
                    onChange={(v) => setDetail(group.options, v, group.multi)}
                    multi={group.multi}
                  />
                </Section>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button
              onClick={onComplete}
              className="w-full rounded-[14px] py-3.5 text-[14px] font-black border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#A8722A,#D4A853)", color: "#1A0E08" }}
            >
              この条件で提案を見る →
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-[12px] py-2.5 text-[12px] font-bold cursor-pointer"
              style={{ color: "rgba(245,238,228,.58)", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)" }}
            >
              あとで細かく設定する
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
