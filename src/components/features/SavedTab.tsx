"use client";
import { useEffect, useState } from "react";
import { CAT_META } from "@/lib/constants";
import { PLAN_RULES } from "@/lib/plan";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ProductImage, Stars } from "@/components/ui";
import type { Product, ProductSave } from "@/types";

type SavedMode = "favorite" | "compare";
const FALLBACK_CATEGORY = "スキンケア";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
  onOpenProduct: (product: Product) => void;
}

export default function SavedTab({ isPro, onUpgrade, onOpenProduct }: Props) {
  const [mode, setMode] = useState<SavedMode>("favorite");
  const [saves, setSaves] = useState<ProductSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSaves = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaves([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/product-saves", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      setSaves(res.ok ? data.saves ?? [] : []);
    } catch {
      setSaves([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSaves();
  }, []);

  const updateSave = async (save: ProductSave, next: Partial<Pick<ProductSave, "favorite" | "compare">>) => {
    setSavingKey(save.product_key);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSavingKey(null);
      return;
    }

    const res = await fetch("/api/product-saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session.access_token,
        product: save.product,
        favorite: next.favorite ?? save.favorite,
        compare: next.compare ?? save.compare,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429 && data.error) {
      alert(data.error);
      if (!isPro) onUpgrade();
    } else {
      await fetchSaves();
    }
    setSavingKey(null);
  };

  const favoriteSaves = saves.filter((save) => save.favorite);
  const compareSaves = saves.filter((save) => save.compare);
  const visibleSaves = mode === "favorite" ? favoriteSaves : compareSaves;
  const compareLimit = isPro ? PLAN_RULES.pro.compareLimit : PLAN_RULES.free.compareLimit;
  const favoriteLimit = isPro ? PLAN_RULES.pro.favoriteLimit : PLAN_RULES.free.favoriteLimit;

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 保存棚</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 32, fontWeight: 400, color: "#150B00", margin: 0 }}>
          保存した商品
        </h1>
        <p style={{ fontSize: 13, color: "#8A7A6E", marginTop: 6 }}>あとで比較。</p>
      </div>

      {!isPro && (
        <div className="saved-plan-note">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#150B00" }}>無料の保存枠</div>
            <div style={{ fontSize: 11, color: "#8A7A6E", marginTop: 3 }}>
              お気に入り {favoriteSaves.length}/{favoriteLimit} ・ 比較 {compareSaves.length}/{compareLimit}
            </div>
          </div>
          <button onClick={onUpgrade} style={{ border: "none", borderRadius: 999, padding: "8px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
            PROへ
          </button>
        </div>
      )}

      <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {([
          ["favorite", `お気に入り ${favoriteSaves.length}`],
          ["compare", `比較リスト ${compareSaves.length}`],
        ] as [SavedMode, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 9,
              background: mode === value ? "#1A0E08" : "transparent",
              color: mode === value ? "#FBF8F3" : "#8A7A6E",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="app-empty-state compact">
          <span>保存</span>
          <div>
            <strong>保存商品を読み込み中です</strong>
            <p>少しだけ待ってください。</p>
          </div>
        </div>
      ) : visibleSaves.length === 0 ? (
        <div className="app-empty-state">
          <span>{mode === "favorite" ? "保存" : "比較"}</span>
          <div>
            <strong>{mode === "favorite" ? "お気に入りはまだありません" : "比較リストはまだありません"}</strong>
            <p>商品詳細から追加できます。まず気になるものだけでOKです。</p>
          </div>
        </div>
      ) : mode === "favorite" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {visibleSaves.map((save) => (
            <SavedCard
              key={save.id}
              save={save}
              onOpen={() => onOpenProduct(save.product)}
              onRemove={() => updateSave(save, { favorite: false })}
              loading={savingKey === save.product_key}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {visibleSaves.map((save) => (
            <CompareCard
              key={save.id}
              save={save}
              onOpen={() => onOpenProduct(save.product)}
              onRemove={() => updateSave(save, { compare: false })}
              loading={savingKey === save.product_key}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedCard({ save, onOpen, onRemove, loading }: {
  save: ProductSave; onOpen: () => void; onRemove: () => void; loading: boolean;
}) {
  const p = save.product;
  const m = CAT_META[p.cat] ?? CAT_META[FALLBACK_CATEGORY];
  const categoryLabel = CAT_META[p.cat] ? p.cat : FALLBACK_CATEGORY;
  return (
    <div style={{ background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}>
      <button onClick={onOpen} style={{ display: "block", width: "100%", border: "none", padding: 0, background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <div style={{ height: 150, background: m.color, position: "relative" }}>
          <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} />
          <div style={{ position: "absolute", top: 8, left: 8, fontSize: 10, background: "#fff", color: m.dark, borderRadius: 999, padding: "3px 8px", fontWeight: 800 }}>
            {m.icon} {categoryLabel}
          </div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em", marginBottom: 3 }}>{p.brand}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, lineHeight: 1.35, color: "#150B00", fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
          <Stars rating={p.rating} size={10} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, color: "#A8722A", fontWeight: 500 }}>{formatPrice(p.price)}</span>
            <span style={{ fontSize: 10, color: "#8A7A6E" }}>{p.rev.toLocaleString()}件</span>
          </div>
        </div>
      </button>
      <button onClick={onRemove} disabled={loading} style={{ width: "100%", border: "none", borderTop: "1px solid #EDE5DC", background: "#F8F4EF", padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "#8A7A6E", cursor: loading ? "default" : "pointer" }}>
        {loading ? "更新中..." : "お気に入りから外す"}
      </button>
    </div>
  );
}

function CompareCard({ save, onOpen, onRemove, loading }: {
  save: ProductSave; onOpen: () => void; onRemove: () => void; loading: boolean;
}) {
  const p = save.product;
  const m = CAT_META[p.cat] ?? CAT_META[FALLBACK_CATEGORY];
  const categoryLabel = CAT_META[p.cat] ? p.cat : FALLBACK_CATEGORY;
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, overflow: "hidden" }}>
      <button onClick={onOpen} style={{ width: "100%", border: "none", background: "transparent", padding: "14px", textAlign: "left", cursor: "pointer" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", background: m.color, flexShrink: 0 }}>
            <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: m.accent, fontWeight: 800 }}>{p.brand}</div>
            <div style={{ fontSize: 13, color: "#150B00", fontWeight: 700, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
          </div>
        </div>
        {[
          ["カテゴリ", `${categoryLabel} / ${p.sub}`],
          ["価格", formatPrice(p.price)],
          ["評価", `${p.rating} / ${p.rev.toLocaleString()}件`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid #F1EADE", padding: "8px 0", fontSize: 12 }}>
            <span style={{ color: "#8A7A6E" }}>{label}</span>
            <span style={{ color: "#150B00", fontWeight: 700, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </button>
      <button onClick={onRemove} disabled={loading} style={{ width: "100%", border: "none", borderTop: "1px solid #EDE5DC", background: "#F8F4EF", padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "#8A7A6E", cursor: loading ? "default" : "pointer" }}>
        {loading ? "更新中..." : "比較から外す"}
      </button>
    </div>
  );
}
