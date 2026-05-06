"use client";
import { useEffect, useState } from "react";
import { CAT_META } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { PLAN_RULES, getRemaining, isWithinLimit } from "@/lib/plan";
import { GoldButton, Input, Select } from "@/components/ui";
import type { Category, LogEntry } from "@/types";

const CATS = Object.keys(CAT_META) as Category[];
const DEFAULT_CATEGORY = CATS[0];
const UNKNOWN_PRODUCT_NAME = "\u5546\u54c1\u540d\u672a\u8a2d\u5b9a";
const UNKNOWN_DATE = "\u65e5\u4ed8\u672a\u8a2d\u5b9a";

function getDisplayCategory(value?: string | null): Category {
  return CATS.includes(value as Category) ? (value as Category) : DEFAULT_CATEGORY;
}

function isBrokenText(value?: string | null) {
  const text = (value ?? "").trim();
  if (!text) return true;
  const questionCount = (text.match(/\?/g) ?? []).length;
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  return /^\?+$/.test(text) || text.includes("????") || replacementCount > 0 || (questionCount >= 3 && questionCount / text.length > 0.25);
}

function cleanText(value: string | null | undefined, fallback: string) {
  return isBrokenText(value) ? fallback : value!.trim();
}

interface Props {
  userId: string;
  isPro: boolean;
  onUpgrade: () => void;
}

export default function LogTab({ userId, isPro, onUpgrade }: Props) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [form, setForm] = useState({ prod: "", cat: "スキンケア" as Category, rating: 5, memo: "" });

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("log_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setLog(data ?? []);
      setLoading(false);
    };
    fetchLog();
  }, [userId]);

  const saveEntry = async () => {
    if (!form.prod.trim()) return;
    if (!isWithinLimit(log.length, isPro ? null : PLAN_RULES.free.logLimit)) {
      setLimitReached(true);
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/log-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session?.access_token,
        productName: form.prod,
        category: form.cat,
        rating: form.rating,
        memo: form.memo,
        startedAt: today,
      }),
    });

    if (res.status === 429) {
      setLimitReached(true);
      setSaving(false);
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.entry) {
      setSaving(false);
      return;
    }
    setLog((prev) => [data.entry as LogEntry, ...prev]);
    setForm({ prod: "", cat: "スキンケア", rating: 5, memo: "" });
    setShowForm(false);
    setSaving(false);
  };

  const validRatings = log.map((e) => Number(e.rating)).filter((rating) => Number.isFinite(rating));
  const avgRating = validRatings.length
    ? (validRatings.reduce((s, rating) => s + rating, 0) / validRatings.length).toFixed(1)
    : "—";
  const catCount = new Set(log.map((e) => getDisplayCategory(e.category))).size;
  const logLimit = isPro ? null : PLAN_RULES.free.logLimit;
  const remainingLogCount = getRemaining(log.length, logLimit);
  const canAddLog = isWithinLimit(log.length, logLimit);

  return (
    <div className="px-4 py-5">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[24px] italic" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
          My Beauty Log
        </h2>
        <button
          onClick={() => {
            if (!canAddLog) {
              setLimitReached(true);
              return;
            }
            setLimitReached(false);
            setShowForm((s) => !s);
          }}
          className="rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold text-white border-none cursor-pointer"
          style={{ background: "#150B00" }}>
          + 記録
        </button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "#8A7A6E" }}>使用中アイテムの記録と振り返り</p>

      {!isPro && (
        <div className="rounded-[14px] border px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: "#fff", borderColor: limitReached ? "#D4A853" : "#EDE5DC" }}>
          <div style={{ flex: 1 }}>
            <p className="text-[12px] font-bold" style={{ color: "#150B00" }}>
              無料プラン: ログあと{remainingLogCount ?? 0}件
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#8A7A6E" }}>
              PROなら美容ログを無制限で残せます。
            </p>
          </div>
          <button onClick={onUpgrade} className="rounded-full px-3 py-1.5 text-[11px] font-bold border-none cursor-pointer"
            style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08" }}>
            PROへ
          </button>
        </div>
      )}

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "記録数",   value: loading ? "…" : log.length, icon: "📝" },
          { label: "平均評価", value: loading ? "…" : avgRating,   icon: "⭐" },
          { label: "カテゴリ", value: loading ? "…" : catCount,    icon: "📂" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#EDE5DC] rounded-[14px] py-3 text-center">
            <p className="text-[20px] mb-1">{s.icon}</p>
            <p className="text-[18px] font-bold" style={{ color: "#150B00" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "#8A7A6E" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── NEW ENTRY FORM ── */}
      {showForm && (
        <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4 mb-4 fade-up"
          style={{ boxShadow: "0 4px 24px rgba(21,11,0,.07)" }}>
          <p className="text-[14px] font-bold mb-3" style={{ color: "#150B00" }}>新しいアイテムを記録</p>
          <Input value={form.prod} onChange={(v) => setForm((f) => ({ ...f, prod: v }))} placeholder="製品名" className="mb-2" />
          <Select value={form.cat} onChange={(v) => setForm((f) => ({ ...f, cat: v as Category }))} options={CATS} />
          <div className="my-3">
            <p className="text-[11px] mb-1.5" style={{ color: "#8A7A6E" }}>評価</p>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}
                onClick={() => setForm((f) => ({ ...f, rating: n }))}
                className="text-[28px] cursor-pointer"
                style={{ color: n <= form.rating ? "#D4A853" : "#ddd" }}>★</span>
            ))}
          </div>
          <textarea
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="使用感・メモ..."
            className="w-full border-[1.5px] border-[#EDE5DC] rounded-[12px] px-4 py-3 text-[14px] resize-none mb-3 outline-none focus:border-[#D4A853]"
            style={{ height: 80, fontFamily: "inherit" }}
          />
          <GoldButton onClick={saveEntry} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </GoldButton>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="text-center py-10" style={{ color: "#8A7A6E", fontSize: 13 }}>読み込み中...</div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && log.length === 0 && (
        <div className="text-center py-10">
          <p className="text-[36px] mb-2">📝</p>
          <p className="text-[14px] font-semibold" style={{ color: "#150B00" }}>まだ記録がありません</p>
          <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>右上の「+ 記録」から追加しましょう</p>
        </div>
      )}

      {/* ── LOG ENTRIES (timeline) ── */}
      {!loading && log.map((item, idx) => {
        const displayCategory = getDisplayCategory(item.category);
        const m = CAT_META[displayCategory];
        const productName = cleanText(item.product_name, UNKNOWN_PRODUCT_NAME);
        const memo = cleanText(item.memo, "");
        const startedAt = cleanText(item.started_at, UNKNOWN_DATE);
        const rating = Number.isFinite(Number(item.rating)) ? Number(item.rating) : 0;
        const isLast = idx === log.length - 1;
        return (
          <div key={item.id} className="relative pl-5">
            {/* 縦線 */}
            {!isLast && (
              <div className="absolute left-[7px] top-[22px] w-[1.5px]" style={{ bottom: -14, background: "#EDE5DC" }} />
            )}
            {/* ドット */}
            <div className="absolute left-0 top-4 w-4 h-4 rounded-full border-[2.5px] border-[#F8F4EF]"
              style={{ background: m.accent }} />

            <div className="ml-1 mb-3.5 bg-white rounded-[16px] border border-[#EDE5DC] p-3.5 fade-up"
              style={{ boxShadow: "0 4px 24px rgba(21,11,0,.07)" }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px]"
                    style={{ background: m.color }}>{m.icon}</div>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: m.accent }}>{displayCategory}</p>
                    <p className="text-[14px] font-bold" style={{ color: "#150B00" }}>{productName}</p>
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: "#C4B4A8" }}>{startedAt}</p>
              </div>
              <div>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="text-[15px]" style={{ color: n <= rating ? "#D4A853" : "#ddd" }}>★</span>
                ))}
              </div>
              {memo && (
                <p className="text-[12px] mt-2 px-3 py-2 rounded-[10px] italic leading-[1.6]"
                  style={{ background: "#F8F4EF", color: "#555" }}>
                  「{memo}」
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
