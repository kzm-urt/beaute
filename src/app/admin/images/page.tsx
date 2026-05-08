"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getProductImageUrl } from "@/lib/storage";
import { PRODUCTS, CAT_META } from "@/lib/constants";

type UploadState = "idle" | "uploading" | "done" | "error";

interface ProductUploadState {
  status: UploadState;
  url?: string;
}

export default function AdminImagesPage() {
  const [states, setStates] = useState<Record<number, ProductUploadState>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleFileChange = async (productId: number, file: File) => {
    setStates(prev => ({ ...prev, [productId]: { status: "uploading" } }));

    // webpに変換せずそのまま upload（ファイル名は {id}.webp で固定）
    const { error } = await supabase.storage
      .from("product-images")
      .upload(`${productId}.webp`, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error(error);
      setStates(prev => ({ ...prev, [productId]: { status: "error" } }));
      return;
    }

    const url = getProductImageUrl(productId);
    setStates(prev => ({ ...prev, [productId]: { status: "done", url } }));
  };

  const uploadedCount = Object.values(states).filter(s => s.status === "done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F4EF", padding: "32px 24px" }}>
      {/* ヘッダー */}
      <div style={{ maxWidth: 960, margin: "0 auto 32px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, color: "#150B00", marginBottom: 8 }}>
          beautia — 製品画像管理
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 13, color: "#6B5B4A" }}>
            アップロード済み: <strong>{uploadedCount}</strong> / {PRODUCTS.length} 製品
          </div>
          {/* プログレスバー */}
          <div style={{ flex: 1, maxWidth: 200, height: 6, background: "#EDE5DC", borderRadius: 999 }}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: "linear-gradient(135deg, #D4A853, #A8722A)",
              width: `${(uploadedCount / PRODUCTS.length) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#A0907E", marginTop: 8 }}>
          ※ Supabase ダッシュボード → Storage → product-images バケットを <strong>public</strong> に設定してください。
        </p>
      </div>

      {/* 製品グリッド */}
      <div style={{
        maxWidth: 960, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
      }}>
        {PRODUCTS.map(p => {
          const state = states[p.id] ?? { status: "idle" };
          const m = CAT_META[p.cat];
          const supabaseUrl = getProductImageUrl(p.id);

          return (
            <div key={p.id} style={{
              background: "#FBF8F3", borderRadius: 14,
              border: `1px solid ${state.status === "done" ? "#4AAD8B" : "#EDE5DC"}`,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(21,11,0,.05)",
              transition: "border-color 0.2s",
            }}>
              {/* 画像プレビュー */}
              <div
                onClick={() => inputRefs.current[p.id]?.click()}
                style={{
                  position: "relative", aspectRatio: "1/1",
                  background: m.color, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* 現在の画像（Supabase優先 → Unsplash fallback） */}
                <img
                  src={supabaseUrl}
                  alt={p.name}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = p.image; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* ホバーオーバーレイ */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(21,11,0,.45)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                  opacity: 0, transition: "opacity 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <span style={{ fontSize: 24 }}>📷</span>
                  <span style={{ fontSize: 11, color: "#FBF8F3", fontWeight: 600 }}>
                    クリックで変更
                  </span>
                </div>

                {/* ステータスバッジ */}
                {state.status === "uploading" && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(21,11,0,.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 13, color: "#FBF8F3" }}>アップロード中…</span>
                  </div>
                )}
                {state.status === "done" && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "#4AAD8B", color: "#fff",
                    borderRadius: 999, width: 22, height: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                  }}>✓</div>
                )}
                {state.status === "error" && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "#C0392B", color: "#fff",
                    borderRadius: 999, width: 22, height: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}>!</div>
                )}

                {/* 非表示のinput */}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={el => { inputRefs.current[p.id] = el; }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(p.id, file);
                  }}
                />
              </div>

              {/* 製品情報 */}
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: m.accent, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>
                  {m.icon} {p.cat}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#150B00", lineHeight: 1.3, marginBottom: 2 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: "#8A7A6E" }}>{p.brand}</div>
                <div style={{ fontSize: 9, color: "#B0A090", marginTop: 4 }}>ID: {p.id}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
