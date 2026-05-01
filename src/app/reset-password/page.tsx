"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabaseのリセットリンクからセッションを取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError("パスワードの更新に失敗しました。もう一度お試しください");
    } else {
      setDone(true);
      // 3秒後にトップページへ
      setTimeout(() => { window.location.href = "/"; }, 3000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F8F4EF",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 48, fontWeight: 500, color: "#150B00" }}>
          beauté
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginTop: 6 }}>
          — EST. MMXXV —
        </div>
      </div>

      <div style={{
        width: "100%", maxWidth: 400,
        background: "#FBF8F3", borderRadius: 20,
        border: "1px solid #EDE5DC",
        boxShadow: "0 8px 40px rgba(21,11,0,.08)",
        padding: "36px 32px",
      }}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#150B00", marginBottom: 8 }}>
              パスワードを更新しました
            </div>
            <div style={{ fontSize: 13, color: "#8A7A6E" }}>
              まもなくトップページへ移動します...
            </div>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: "center", color: "#8A7A6E", fontSize: 14 }}>
            リンクを確認中...
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#150B00", marginBottom: 6 }}>
              新しいパスワードを設定
            </div>
            <div style={{ fontSize: 12, color: "#8A7A6E", marginBottom: 24 }}>
              8文字以上のパスワードを入力してください
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#6B5B4A", marginBottom: 6, letterSpacing: "0.08em" }}>
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: "1px solid #DDD5C8", borderRadius: 10,
                    fontSize: 14, background: "#F8F4EF", color: "#150B00",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", fontSize: 11, color: "#6B5B4A", marginBottom: 6, letterSpacing: "0.08em" }}>
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: "1px solid #DDD5C8", borderRadius: 10,
                    fontSize: 14, background: "#F8F4EF", color: "#150B00",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", background: "#FEF0F0", border: "1px solid #F5C6C6",
                  borderRadius: 8, fontSize: 13, color: "#C0392B", marginBottom: 14,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "#C89E6A" : "linear-gradient(135deg, #D4A853, #A8722A)",
                  color: "#1A0E08", border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {loading ? "更新中..." : "パスワードを更新"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
