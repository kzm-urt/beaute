import { NextRequest, NextResponse } from "next/server";

const LOCK_AFTER_FAILURES = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const REALM = "beaute admin";

type BasicCredentials = {
  username: string;
  password: string;
};

type AttemptState = {
  failures: number;
  lockedUntil: number;
};

const attemptStore = new Map<string, AttemptState>();

function isProtectedAdminRequest(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) return true;
  if (pathname === "/api/system-status") return true;
  if (pathname === "/api/product-events" && (req.method === "GET" || req.method === "HEAD")) return true;
  return false;
}

function getClientKey(req: NextRequest, credentials: BasicCredentials | null) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  return `${ip}:${credentials?.username || "unknown"}`;
}

function decodeBasicAuth(header: string | null): BasicCredentials | null {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length).trim());
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return null;

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function constantTimeEqual(a: string, b: string) {
  const maxLength = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;

  for (let i = 0; i < maxLength; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }

  return diff === 0;
}

function unauthorizedResponse(status = 401, message = "Admin authentication required.") {
  return new NextResponse(message, {
    status,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function recordFailure(key: string) {
  const now = Date.now();
  const current = attemptStore.get(key);
  const nextFailures = current && current.lockedUntil > now ? current.failures + 1 : (current?.failures ?? 0) + 1;
  const lockedUntil = nextFailures >= LOCK_AFTER_FAILURES ? now + LOCK_WINDOW_MS : 0;

  attemptStore.set(key, {
    failures: nextFailures,
    lockedUntil,
  });
}

export function middleware(req: NextRequest) {
  if (!isProtectedAdminRequest(req)) return NextResponse.next();

  const expectedUser = process.env.ADMIN_BASIC_USER;
  const expectedPassword = process.env.ADMIN_BASIC_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return unauthorizedResponse(503, "Admin Basic authentication is not configured.");
  }

  const credentials = decodeBasicAuth(req.headers.get("authorization"));
  const clientKey = getClientKey(req, credentials);
  const state = attemptStore.get(clientKey);
  const now = Date.now();

  if (state?.lockedUntil && state.lockedUntil > now) {
    return unauthorizedResponse(429, "Too many failed admin login attempts. Try again later.");
  }

  const isValid =
    credentials &&
    constantTimeEqual(credentials.username, expectedUser) &&
    constantTimeEqual(credentials.password, expectedPassword);

  if (!isValid) {
    recordFailure(clientKey);
    return unauthorizedResponse();
  }

  attemptStore.delete(clientKey);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/system-status", "/api/product-events"],
};
