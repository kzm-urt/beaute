"use client";
import { useState } from "react";

type Mode = "signin" | "signup" | "reset";

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ message: string } | null>;
  onSignUp: (email: string, password: string) => Promise<{ message: string } | null>;
  onSendPasswordReset?: (email: string) => Promise<{ message: string } | null>;
  onContinueAsGuest?: () => void;
}

export default function AuthScreen({ onSignIn, onSignUp, onSendPasswordReset, onContinueAsGuest }: Props) {
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
    <main className="auth-page">
      <section className="auth-hero" aria-label="beauté">
        <div className="auth-brand-block">
          <div className="auth-logo">beauté</div>
          <div className="auth-kicker">PERSONAL BEAUTY SEARCH</div>
        </div>

        <div className="auth-copy">
          <p className="auth-eyebrow">楽天市場の商品情報をもとに</p>
          <h1>肌・髪・悩みに合う美容アイテムを、選ぶ理由まで。</h1>
          <p>
            商品検索、ランキング、成分分析、保存リストをひとつにまとめて、
            毎日の美容選びを迷いにくくします。
          </p>
        </div>

        <div className="auth-signal-list" aria-label="beautéでできること">
          <div>
            <span>01</span>
            楽天商品を検索・比較
          </div>
          <div>
            <span>02</span>
            成分と悩みを照らし合わせ
          </div>
          <div>
            <span>03</span>
            気になる商品を保存
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-label="ログインまたは新規登録">
        {/* タブ切り替え（リセットモード時は非表示） */}
        {mode !== "reset" && (
          <div className="auth-tabs" role="tablist" aria-label="認証メニュー">
            {(["signin", "signup"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="auth-tab"
                aria-pressed={mode === m}
              >
                {m === "signin" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>
        )}

        {/* パスワードリセットヘッダー */}
        {mode === "reset" && (
          <div className="auth-reset-head">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="auth-text-button"
            >
              ← ログインに戻る
            </button>
            <h2>パスワードをリセット</h2>
            <p>
              登録済みのメールアドレスにリセット用のリンクを送信します
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* メール */}
          <div className="auth-field">
            <label htmlFor="auth-email">
              メールアドレス
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              className="auth-input"
            />
          </div>

          {/* パスワード（リセットモード時は非表示） */}
          {mode !== "reset" && (
            <div className="auth-field">
              <label htmlFor="auth-password">
                パスワード {mode === "signup" && <span>（8文字以上）</span>}
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
                placeholder="••••••••"
                className="auth-input"
              />
            </div>
          )}

          {/* パスワードを忘れた場合（ログインモードのみ） */}
          {mode === "signin" && (
            <div className="auth-forgot">
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="auth-text-button"
              >
                パスワードをお忘れですか？
              </button>
            </div>
          )}

          {mode !== "signin" && <div style={{ marginBottom: 16 }} />}

          {/* エラー・インフォ */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="auth-alert auth-alert-info" role="status">
              {info}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading
              ? "処理中..."
              : mode === "signin"
              ? "ログイン"
              : mode === "signup"
              ? "アカウント作成"
              : "リセットメールを送信"}
          </button>
          {onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="auth-guest-button"
            >
              {"\u767b\u9332\u305b\u305a\u306b\u5546\u54c1\u3092\u898b\u3066\u307f\u308b"}
            </button>
          )}
        </form>

        <div className="auth-plan-note">
          <strong>{mode === "signup" ? "無料ではじめられます" : "PROは7日間トライアル"}</strong>
          <span>
            {mode === "signup"
              ? "商品購入は楽天市場などの外部ECで行われます。"
              : "ログイン後にプラン管理・保存リスト・分析履歴を確認できます。"}
          </span>
        </div>

        {/* フッター */}
        <p className="auth-footer">
          beauté はあなたの美容データを安全に保護します。
          <br />
          <a href="/terms">利用規約</a>
          <span> / </span>
          <a href="/privacy">プライバシー</a>
          <span> / </span>
          <a href="/commercial">特商法表記</a>
        </p>
      </section>
    </main>
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
