"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const RATING_FIELDS = [
  { key: "overallRating", label: "全体の満足度", hint: "また触りたい、誰かに見せたいと思えたか" },
  { key: "clarityRating", label: "使い方の分かりやすさ", hint: "何をすればいいか迷わなかったか" },
  { key: "recommendationRating", label: "おすすめの納得感", hint: "自分に合いそう、買う理由が分かると思えたか" },
  { key: "designRating", label: "見た目の印象", hint: "高級感、読みやすさ、スマホでの気持ちよさ" },
  { key: "paidValueRating", label: "有料にする価値", hint: "月500円なら試す理由があるか" },
] as const;

const FEATURE_OPTIONS = [
  "商品検索",
  "楽天ランキング",
  "商品詳細",
  "パーソナル",
  "成分分析",
  "保存・比較",
  "YouTube/動画導線",
  "PROプラン",
];

const CONFUSING_OPTIONS = [
  "最初に何をすればいいか",
  "パーソナルの意味",
  "FREE/PROの違い",
  "商品詳細の見方",
  "保存・比較の使い方",
  "スマホ操作",
  "価格・課金",
  "特になし",
];

type RatingKey = (typeof RATING_FIELDS)[number]["key"];

type FormState = Record<RatingKey, number> & {
  testerName: string;
  contact: string;
  relation: string;
  device: string;
  likedFeatures: string[];
  confusingParts: string[];
  wouldPay: string;
  expectedPrice: string;
  mostValuable: string;
  missingFeature: string;
  mobileIssue: string;
  referralIdea: string;
  freeComment: string;
  permissionToQuote: boolean;
};

const initialState: FormState = {
  testerName: "",
  contact: "",
  relation: "friend",
  device: "unknown",
  overallRating: 4,
  clarityRating: 4,
  recommendationRating: 4,
  designRating: 4,
  paidValueRating: 3,
  likedFeatures: [],
  confusingParts: [],
  wouldPay: "maybe",
  expectedPrice: "500円/月",
  mostValuable: "",
  missingFeature: "",
  mobileIssue: "",
  referralIdea: "",
  freeComment: "",
  permissionToQuote: true,
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="feedback-rating" role="radiogroup">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          aria-pressed={value === score}
          onClick={() => onChange(score)}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

function CheckRail({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="feedback-chip-grid">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggle(value, option))}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const width = window.innerWidth;
    setForm((current) => ({
      ...current,
      device: width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    }));
  }, []);

  const shareCopy = useMemo(
    () =>
      "beautiaのテスト版を触って、1分くらいの感想アンケートに答えてもらえると嬉しいです。美容アイテム検索とランキング、パーソナル、PRO導線まわりを見てほしいです。",
    []
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          referrer: document.referrer,
          path: window.location.pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信できませんでした。");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信できませんでした。");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="feedback-page">
        <section className="feedback-complete">
          <div className="feedback-kicker">THANK YOU</div>
          <h1>回答ありがとうございます。</h1>
          <p>
            もらった感想をもとに、使い方・パーソナル・有料にする理由・スマホの触り心地を詰めていきます。
          </p>
          <div className="feedback-actions">
            <a href="/">beautiaに戻る</a>
            <a href="/?tab=guide">使い方を見る</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="feedback-page">
      <section className="feedback-hero">
        <a className="feedback-logo" href="/">beautia</a>
        <div>
          <div className="feedback-kicker">BETA TEST FEEDBACK</div>
          <h1>1分だけ、率直な感想をください。</h1>
          <p>
            知り合い向けのテスト公開です。良かったところ、分かりにくいところ、有料なら何が必要かを見たいです。
          </p>
        </div>
        <div className="feedback-share-box">
          <span>送る時の一言</span>
          <p>{shareCopy}</p>
        </div>
      </section>

      <form className="feedback-form" onSubmit={submit}>
        <section className="feedback-card feedback-grid-two">
          <label>
            お名前 / ニックネーム
            <input
              value={form.testerName}
              onChange={(event) => update("testerName", event.target.value)}
              placeholder="例: さき / Kさん"
            />
          </label>
          <label>
            連絡先 / SNS名
            <input
              value={form.contact}
              onChange={(event) => update("contact", event.target.value)}
              placeholder="任意。後で詳しく聞いてOKなら"
            />
          </label>
          <label>
            関係・見方
            <select value={form.relation} onChange={(event) => update("relation", event.target.value)}>
              <option value="friend">知り合い・友人</option>
              <option value="beauty">美容好き</option>
              <option value="creator">発信者・クリエイター</option>
              <option value="business">仕事目線</option>
              <option value="other">その他</option>
            </select>
          </label>
          <label>
            見た端末
            <select value={form.device} onChange={(event) => update("device", event.target.value)}>
              <option value="mobile">スマホ</option>
              <option value="desktop">PC</option>
              <option value="tablet">タブレット</option>
              <option value="unknown">分からない</option>
            </select>
          </label>
        </section>

        <section className="feedback-card">
          <div className="feedback-section-head">
            <span>01</span>
            <h2>5段階で教えてください</h2>
          </div>
          <div className="feedback-rating-list">
            {RATING_FIELDS.map((field) => (
              <div key={field.key} className="feedback-rating-row">
                <div>
                  <strong>{field.label}</strong>
                  <p>{field.hint}</p>
                </div>
                <RatingInput value={form[field.key]} onChange={(value) => update(field.key, value)} />
              </div>
            ))}
          </div>
        </section>

        <section className="feedback-card">
          <div className="feedback-section-head">
            <span>02</span>
            <h2>刺さったところ / 迷ったところ</h2>
          </div>
          <div className="feedback-label-block">
            <div>良かった・もう少し触りたいと思ったところ</div>
            <CheckRail
              options={FEATURE_OPTIONS}
              value={form.likedFeatures}
              onChange={(value) => update("likedFeatures", value)}
            />
          </div>
          <div className="feedback-label-block">
            <div>分かりにくかったところ</div>
            <CheckRail
              options={CONFUSING_OPTIONS}
              value={form.confusingParts}
              onChange={(value) => update("confusingParts", value)}
            />
          </div>
        </section>

        <section className="feedback-card feedback-grid-two">
          <label>
            月500円なら使いそう？
            <select value={form.wouldPay} onChange={(event) => update("wouldPay", event.target.value)}>
              <option value="yes">使うと思う</option>
              <option value="maybe">条件次第</option>
              <option value="no">今のままだと払わない</option>
              <option value="unknown">分からない</option>
            </select>
          </label>
          <label>
            ちょうど良さそうな価格
            <input
              value={form.expectedPrice}
              onChange={(event) => update("expectedPrice", event.target.value)}
              placeholder="例: 300円/月、500円/月、買い切りなら..."
            />
          </label>
          <label className="feedback-wide">
            お金を払う理由になるとしたら何？
            <textarea
              value={form.mostValuable}
              onChange={(event) => update("mostValuable", event.target.value)}
              placeholder="例: 自分に合う理由がもっと具体的、買う前の失敗を減らせる、動画や口コミもまとまる..."
            />
          </label>
          <label className="feedback-wide">
            足りない機能・もっと欲しい体験
            <textarea
              value={form.missingFeature}
              onChange={(event) => update("missingFeature", event.target.value)}
              placeholder="例: 今使っている商品登録、肌状態の記録、インフルエンサー比較、友達に共有..."
            />
          </label>
          <label className="feedback-wide">
            スマホで気になったところ
            <textarea
              value={form.mobileIssue}
              onChange={(event) => update("mobileIssue", event.target.value)}
              placeholder="押しにくい、読みにくい、重い、戻りにくいなど"
            />
          </label>
          <label className="feedback-wide">
            どう広まると使われそう？
            <textarea
              value={form.referralIdea}
              onChange={(event) => update("referralIdea", event.target.value)}
              placeholder="SNS、友達紹介、美容系YouTube、レビュー投稿、診断結果共有など"
            />
          </label>
          <label className="feedback-wide">
            その他なんでも
            <textarea
              value={form.freeComment}
              onChange={(event) => update("freeComment", event.target.value)}
              placeholder="厳しめでもOK。率直な感想が一番助かります。"
            />
          </label>
        </section>

        <section className="feedback-submit-card">
          <label className="feedback-quote">
            <input
              type="checkbox"
              checked={form.permissionToQuote}
              onChange={(event) => update("permissionToQuote", event.target.checked)}
            />
            回答の一部を、匿名の感想として紹介してOK
          </label>
          {error && <p className="feedback-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "送信中..." : "感想を送信する"}
          </button>
        </section>
      </form>
    </main>
  );
}
