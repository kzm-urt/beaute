"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/plan";

type CheckStatus = "pass" | "warn" | "fail";

interface StatusCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  action?: string;
}

interface StatusGroup {
  key: string;
  title: string;
  checks: StatusCheck[];
}

interface SystemStatus {
  generatedAt: string;
  overallStatus: CheckStatus;
  summary: Record<CheckStatus, number>;
  groups: StatusGroup[];
  nextActions: Array<{
    label: string;
    status: CheckStatus;
    action?: string;
  }>;
}

const STATUS_COPY: Record<CheckStatus, { label: string; color: string; bg: string; border: string }> = {
  pass: { label: "OK", color: "#247A55", bg: "#EAF7F0", border: "#BFE5D0" },
  warn: { label: "要確認", color: "#986A13", bg: "#FFF5D8", border: "#E8CD83" },
  fail: { label: "未対応", color: "#B13A2E", bg: "#FDE9E5", border: "#E7B8B0" },
};

function StatusPill({ status }: { status: CheckStatus }) {
  const meta = STATUS_COPY[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 58,
        padding: "4px 9px",
        borderRadius: 999,
        border: `1px solid ${meta.border}`,
        background: meta.bg,
        color: meta.color,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {meta.label}
    </span>
  );
}

function CheckRow({ check }: { check: StatusCheck }) {
  return (
    <div
      className="admin-status-row"
      style={{
        alignItems: "start",
        padding: "14px 0",
        borderTop: "1px solid #EDE5DC",
      }}
    >
      <StatusPill status={check.status} />
      <div style={{ fontSize: 13, fontWeight: 800, color: "#150B00", lineHeight: 1.5 }}>
        {check.label}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#5E5146", lineHeight: 1.6, wordBreak: "break-word" }}>
          {check.detail}
        </div>
        {check.action && check.status !== "pass" && (
          <div style={{ fontSize: 11, color: "#A8722A", lineHeight: 1.6, marginTop: 4 }}>
            {check.action}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupPanel({ group }: { group: StatusGroup }) {
  const counts = group.checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>
  );

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #EDE5DC",
        borderRadius: 14,
        padding: "18px 20px 4px",
        boxShadow: "0 8px 24px rgba(21, 11, 0, .04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 24,
              color: "#150B00",
              lineHeight: 1.1,
            }}
          >
            {group.title}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              letterSpacing: ".16em",
              fontFamily: "ui-monospace, monospace",
              color: "#8A7A6E",
            }}
          >
            OK {counts.pass} / WARN {counts.warn} / FAIL {counts.fail}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {group.checks.map((check) => (
          <CheckRow key={check.key} check={check} />
        ))}
      </div>
    </section>
  );
}

export default function AdminStatusPage() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email]);

  const loadStatus = useCallback(async () => {
    setChecking(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("ログイン後にもう一度開いてください。");
        setStatus(null);
        return;
      }

      const res = await fetch("/api/system-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "ステータスを取得できませんでした。");
      }

      setStatus(data as SystemStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータスを取得できませんでした。");
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadStatus();
    }
  }, [isAdmin, loadStatus, loading, user]);

  const overall = status?.overallStatus ?? "warn";
  const overallMeta = STATUS_COPY[overall];
  const checkedAt = status?.generatedAt
    ? new Date(status.generatedAt).toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未確認";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8F4EF",
        color: "#150B00",
        padding: "34px 20px 56px",
        fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP",-apple-system,sans-serif',
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".24em",
                fontFamily: "ui-monospace, monospace",
                color: "#A8722A",
                marginBottom: 8,
              }}
            >
              BEAUTIA RELEASE CHECK
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 38,
                lineHeight: 1.1,
                margin: 0,
                color: "#150B00",
                fontWeight: 500,
              }}
            >
              Launch Status
            </h1>
            <p style={{ margin: "8px 0 0", color: "#6B5B4A", fontSize: 13, lineHeight: 1.7 }}>
              本番前に必要な環境変数、Supabaseスキーマ、Stripe、楽天APIの状態をまとめて確認します。
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={loadStatus}
              disabled={checking || loading || !user || !isAdmin}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#1A0E08",
                color: "#FBF8F3",
                fontSize: 12,
                fontWeight: 800,
                cursor: checking || loading || !user || !isAdmin ? "default" : "pointer",
                opacity: checking || loading || !user || !isAdmin ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {checking ? "確認中..." : "再チェック"}
            </button>
            <a
              href="/admin/analytics"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#fff",
                color: "#150B00",
                border: "1px solid #EDE5DC",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              分析を見る
            </a>
          </div>
        </header>

        {loading && (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 20 }}>
            認証状態を確認しています...
          </div>
        )}

        {!loading && !user && (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 20 }}>
            先にアプリへログインしてください。
          </div>
        )}

        {!loading && user && !isAdmin && (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 20 }}>
            この画面は管理者のみ利用できます。`NEXT_PUBLIC_ADMIN_EMAILS` に {user.email} を追加してください。
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FDE9E5",
              border: "1px solid #E7B8B0",
              borderRadius: 14,
              color: "#B13A2E",
              padding: 16,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {status && (
          <>
            <section
              className="admin-status-summary"
              style={{
                background: "linear-gradient(145deg, #1A0E08, #2A1208)",
                border: "1px solid rgba(212,168,83,.35)",
                borderRadius: 16,
                color: "#FBF8F3",
                padding: 22,
                marginBottom: 18,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 10, letterSpacing: ".18em", color: "#D4A853", marginBottom: 8 }}>
                  OVERALL
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: overallMeta.bg,
                      border: `1px solid ${overallMeta.border}`,
                      color: overallMeta.color,
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {overallMeta.label}
                  </span>
                  <span style={{ color: "rgba(251,248,243,.6)", fontSize: 12 }}>最終確認: {checkedAt}</span>
                </div>
              </div>
              <Metric label="OK" value={status.summary.pass} />
              <Metric label="要確認" value={status.summary.warn} />
              <Metric label="未対応" value={status.summary.fail} />
            </section>

            {status.nextActions.length > 0 && (
              <section
                style={{
                  background: "#fff",
                  border: "1px solid #D4A85366",
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>次に潰すこと</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {status.nextActions.map((item) => (
                    <div
                      key={`${item.label}:${item.action}`}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.7 }}
                    >
                      <StatusPill status={item.status} />
                      <div>
                        <strong>{item.label}</strong>
                        <div style={{ color: "#6B5B4A" }}>{item.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div style={{ display: "grid", gap: 16 }}>
              {status.groups.map((group) => (
                <GroupPanel key={group.key} group={group} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        borderLeft: "1px solid rgba(212,168,83,.2)",
        paddingLeft: 14,
      }}
    >
      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 30,
          lineHeight: 1,
          color: "#D4A853",
          fontWeight: 600,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          letterSpacing: ".16em",
          fontFamily: "ui-monospace, monospace",
          color: "rgba(251,248,243,.55)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}
