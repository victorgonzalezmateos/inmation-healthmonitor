/**
 * inmation Web API client — IWA authorize + execfunction.
 *
 * IWA authorize must hit the real host (browser sends Windows credentials).
 * Bearer calls can go through the Vite `/api` proxy (no IWA needed).
 */

export const WEBAPI_HOST = "https://byus00876m1.bayer.cnb:8002";
export const HM_LIB = "syslib.app-webstudio-healthmonitor";

const TOKEN_KEY = "smart-sentinel-webapi-token";
const TOKEN_EXP_KEY = "smart-sentinel-webapi-token-exp";

let memoryToken = null;
let memoryExp = 0;

/**
 * Keep 16+ digit integers as strings so ObjectIDs stay exact
 * (JS Number loses precision above Number.MAX_SAFE_INTEGER).
 */
export function parseJsonPreservingLargeInts(text) {
  if (!text) return null;
  const safe = text.replace(
    /([:\[,]\s*)(-?\d{16,})(?=\s*[,\]}])/g,
    '$1"$2"'
  );
  return JSON.parse(safe);
}

export function getStoredToken() {
  if (memoryToken && Date.now() < memoryExp - 30_000) return memoryToken;
  try {
    const t = sessionStorage.getItem(TOKEN_KEY);
    const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (t && Date.now() < exp - 30_000) {
      memoryToken = t;
      memoryExp = exp;
      return t;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearToken() {
  memoryToken = null;
  memoryExp = 0;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  } catch {
    /* ignore */
  }
}

function saveToken(accessToken, expiresInSec) {
  memoryToken = accessToken;
  memoryExp = Date.now() + (Number(expiresInSec) || 1200) * 1000;
  try {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(TOKEN_EXP_KEY, String(memoryExp));
  } catch {
    /* ignore */
  }
}

/** Manually set a Bearer token (e.g. copied from WebStudio Network tab). */
export function setManualToken(accessToken, expiresInSec = 1200) {
  if (!accessToken) throw new Error("Empty token");
  saveToken(String(accessToken).trim(), expiresInSec);
}

/**
 * IWA: GET /api/security/windows/authorize with credentials:include
 * Tries direct host first (required for Windows auth), then proxy as fallback.
 */
export async function authorizeIwa() {
  const paths = [
    `${WEBAPI_HOST}/api/security/windows/authorize`,
    `/api/security/windows/authorize`,
  ];

  let lastErr = null;
  for (const url of paths) {
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const text = await res.text();
      let body = null;
      try {
        body = text ? parseJsonPreservingLargeInts(text) : null;
      } catch {
        body = { raw: text };
      }

      if (!res.ok) {
        lastErr = new Error(
          `Authorize ${res.status} via ${url}: ${formatApiError(body)}`
        );
        lastErr.status = res.status;
        lastErr.url = url;
        lastErr.body = body;
        continue;
      }

      const token = body?.access_token;
      if (!token) {
        lastErr = new Error(
          `Authorize OK but no access_token in response (${url})`
        );
        lastErr.body = body;
        continue;
      }

      saveToken(token, body.expires_in);
      return {
        access_token: token,
        expires_in: body.expires_in,
        token_type: body.token_type || "Bearer",
        via: url.startsWith("http") ? "direct" : "proxy",
        raw: body,
      };
    } catch (err) {
      lastErr = err;
      lastErr.url = url;
    }
  }

  throw lastErr || new Error("IWA authorize failed");
}

/**
 * POST /api/v2/execfunction/{lib}/{func}
 * `farg` becomes the JSON body (Lua `arg`).
 */
export async function execFunction(lib, func, farg = {}, options = {}) {
  const token = options.token || getStoredToken();
  if (!token) {
    throw new Error("No access token — connect with IWA first");
  }

  // Keep dots in lib name unencoded (syslib.app-…) — matches WebStudio URLs
  const libPath = String(lib).replace(/[^A-Za-z0-9._\-]/g, encodeURIComponent);
  const funcPath = String(func).replace(/[^A-Za-z0-9._\-]/g, encodeURIComponent);
  const url = `/api/v2/execfunction/${libPath}/${funcPath}`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(farg ?? {}),
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? parseJsonPreservingLargeInts(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(
      `execfunction ${lib}/${func} → ${res.status}: ${formatApiError(body)}`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export function execHm(func, farg = {}) {
  return execFunction(HM_LIB, func, farg);
}

export function formatApiError(body) {
  if (!body) return "(empty body)";
  if (typeof body === "string") return body;
  if (body.msg) return body.msg;
  if (Array.isArray(body.error)) {
    return body.error.map((e) => e.msg || JSON.stringify(e)).join("; ");
  }
  if (body.error?.msg) return body.error.msg;
  if (body.raw) return String(body.raw).slice(0, 200);
  try {
    return JSON.stringify(body).slice(0, 240);
  } catch {
    return String(body);
  }
}

/** Decode JWT payload (no verify) for display. */
export function peekTokenClaims(token = getStoredToken()) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
