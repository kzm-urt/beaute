"use client";
import { useEffect, useState } from "react";
import { CAT_META } from "@/lib/constants";
import { GoldButton, Input, Select } from "@/components/ui";
import type { Category, LogEntry } from "@/types";

const CATS = Object.keys(CAT_META) as Category[];
const STORAGE_KEY = "beaute_log";

export default function LogTab() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prod: "", cat: "スキンケア" as Category, rating: 5, memo: "" });

  // LocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLog(JSON.parse(saved));
    else {
      const defaults: LogEntry[] = [
        { id: "1", user_id: "local", product_name: "エルジューダ MO",  category: "ヘアケア",   rating: 5, memo: "アイロン後のダメージが明らかに減った！続ける",  started_at: "2025-01-10", created_at: "2025-01-10" },
        { id: "2", user_id: "local", product_name: "肌ラボ 極潤",       category: "スキンケア", rating: 4, memo: "とろとろ感がクセになる。乾燥がかなり改善。",   started_at: "2025-02-01", created_at: "2025-02-01" },
      ];
      setLog(defaults);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    }
  }, []);

  const saveEntry = () => {
    if (!form.prod.trim()) return;
    const entry: LogEntry = {
      id: Date.now().toString(),
      user_id: "local",
      product_name: form.prod,
      category: form.cat,
      rating: form.rating,
      memo: form.memo,
      started_at: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString().slice(0, 10),
    };
    const next = [entry, ...log];
    setLog(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setForm({ prod: "", cat: "スキンケア", rating: 5, memo: "" });
    setShowForm(false);
  };

  const avgRating = log.length
    ? (log.reduce((s, e) => s + e.rating, 0) / log.length).toFixed(1)
    : "—";
  const catCount = new Set(log.map((e) => e.category)).size;

  return (
    <div className="px-4 py-5">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[24px] italic" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
          My Beauty Log
        </h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold text-white border-none cursor-pointer"
          style={{ background: "#150B00" }}>
          + 記録
        </button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "#8A7A6E" }}>使用中アイテムの記録と振り返り</p>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "記録数",   value: log.length, icon: "📝" },
          { label: "平均評価", value: avgRating,   icon: "⭐" },
          { label: "カテゴリ", value: catCount,    icon: "📂" },
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
          <GoldButton onClick={saveEntry}>保存する</GoldButton>
        </div>
      )}

      {/* ── LOG ENTRIES (timeline) ── */}
      {log.map((item, idx) => {
        const m = CAT_META[item.category] ?? { icon: "✨", color: "#F5E8D5", accent: "#A8722A" };
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
                    <p className="text-[11px] font-semibold" style={{ color: m.accent }}>{item.category}</p>
                    <p className="text-[14px] font-bold" style={{ color: "#150B00" }}>{item.product_name}</p>
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: "#C4B4A8" }}>{item.started_at}</p>
              </div>
              <div>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="text-[15px]" style={{ color: n <= item.rating ? "#D4A853" : "#ddd" }}>★</span>
                ))}
              </div>
              {item.memo && (
                <p className="text-[12px] mt-2 px-3 py-2 rounded-[10px] italic leading-[1.6]"
                  style={{ background: "#F8F4EF", color: "#555" }}>
                  "{item.memo}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
