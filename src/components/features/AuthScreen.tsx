"use client";
import { useState } from "react";

type Mode = "signin" | "signup" | "reset";

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ message: string } | null>;
  onSignUp: (email: string, password: string) => Promise<{ message: string } | null>;
  onSendPasswordReset?: (email: string) => Promise<{ message: string } | null>;
}

export default function AuthScreen({ onSignIn, onSignUp, onSendPasswordReset }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "reset") {
      if (!onSendPasswordReset) return;
      const err = await onSendPasswordReset(email);
      setLoading(false);
      if (err) {
        setError(translateError(err.message));
      } else {
        setInfo("パスワードリセットのメールを送信しました。メールをご確認ください。");
      }
      return;
    }

    const err = mode === "signin"
      ? await onSignIn(email, password)
      : await onSignUp(email, password);

    setLoading(false);

    if (err) {
      setError(translateError(err.message));
    } else if (mode === "signup") {
      setInfo("確認メールを送信しました。メールのリンクをクリックしてください。");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F8F4EF", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      {/* ロゴ */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 48, fontWeight: 500, color: "#150B00", letterSpacing: "0.04em",
        }}>
          beauté
        </div>
        <div style={{
          fontSize: 9, letterSpacing: "0.4em", color: "#A8722A",
          fontFamily: "ui-monospace, monospace", marginTop: 6,
        }}>
          — EST. MMXXV —
        </div>
      </div>

      {/* カード */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#FBF8F3", borderRadius: 20,
        border: "1px solid #EDE5DC",
        boxShadow: "0 8px 40px rgba(21,11,0,.08)",
        padding: "36px 32px",
      }}>
        {/* タブ切り替え（リセットモード時は非表示） */}
        {mode !== "reset" && (
          <div style={{
            display: "flex", background: "#F0EAE2", borderRadius: 10,
            padding: 3, marginBottom: 28,
          }}>
            {(["signin", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "9px 0",
                  background: mode === m ? "#1A0E08" : "transparent",
                  color: mode === m ? "#FBF8F3" : "#8A7A6E",
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
                  transition: "all 0.2s",
                }}
              >
                {m === "signin" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>
        )}

        {/* パスワードリセットヘッダー */}
        {mode === "reset" && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => switchMode("signin")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#A8722A", fontSize: 12, padding: 0, marginBottom: 12 }}
            >
              ← ログインに戻る
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#150B00" }}>パスワードをリセット</div>
            <div style={{ fontSize: 12, color: "#8A7A6E", marginTop: 4 }}>
              登録済みのメールアドレスにリセット用のリンクを送信します
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* メール */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#6B5B4A", marginBottom: 6, letterSpacing: "0.08em" }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              style={{
                width: "100%", padding: "12px 14px",
                border: "1px solid #DDD5C8", borderRadius: 10,
                fontSize: 14, background: "#F8F4EF", color: "#150B00",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* パスワード（リセットモード時は非表示） */}
          {mode !== "reset" && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 11, color: "#6B5B4A", marginBottom: 6, letterSpacing: "0.08em" }}>
                パスワード {mode === "signup" && <span style={{ color: "#A8722A" }}>（8文字以上）</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 14px",
                  border: "1px solid #DDD5C8", borderRadius: 10,
                  fontSize: 14, background: "#F8F4EF", color: "#150B00",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* パスワードを忘れた場合（ログインモードのみ） */}
          {mode === "signin" && (
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A8722A", padding: 0 }}
              >
                パスワードをお忘れですか？
              </button>
            </div>
          )}

          {mode !== "signin" && <div style={{ marginBottom: 16 }} />}

          {/* エラー・インフォ */}
          {error && (
            <div style={{
              padding: "10px 14px", background: "#FEF0F0", border: "1px solid #F5C6C6",
              borderRadius: 8, fontSize: 13, color: "#C0392B", marginBottom: 14,
            }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{
              padding: "10px 14px", background: "#F0F8EF", border: "1px solid #C6E6C3",
              borderRadius: 8, fontSize: 13, color: "#27AE60", marginBottom: 14,
            }}>
              {info}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "#C89E6A" : "linear-gradient(135deg, #D4A853, #A8722A)",
              color: "#1A0E08", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.06em", transition: "opacity 0.2s",
            }}
          >
            {loading
              ? "処理中..."
              : mode === "signin"
              ? "ログイン"
              : mode === "signup"
              ? "アカウント作成"
              : "リセットメールを送信"}
          </button>
        </form>

        {/* フッター */}
        <p style={{
          textAlign: "center", fontSize: 11, color: "#B0A090",
          marginTop: 24, lineHeight: 1.8,
        }}>
          beauté はあなたの美容データを安全に保護します。
          <br />
          <a href="/terms" style={{ color: "#A8722A", textDecoration: "none" }}>利用規約</a>
          <span> / </span>
          <a href="/privacy" style={{ color: "#A8722A", textDecoration: "none" }}>プライバシー</a>
          <span> / </span>
          <a href="/commercial" style={{ color: "#A8722A", textDecoration: "none" }}>特商法表記</a>
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "メールアドレスまたはパスワードが正しくありません";
  if (msg.includes("User already registered")) return "このメールアドレスはすでに登録されています";
  if (msg.includes("Password should be at least")) return "パスワードは8文字以上で入力してください";
  if (msg.includes("Unable to validate email")) return "有効なメールアドレスを入力してください";
  if (msg.includes("Email not confirmed")) return "メールの確認が完了していません。受信ボックスをご確認ください";
  return "エラーが発生しました。しばらくしてから再試行してください";
}
