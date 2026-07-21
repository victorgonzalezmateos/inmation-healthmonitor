/**
 * App-wide IWA session + topbar CONNECTED indicator.
 */

import {
  authorizeIwa,
  clearToken,
  getStoredToken,
  peekTokenClaims,
} from "./api/inmation.js";

let connecting = null;

export function isIwaConnected() {
  return !!getStoredToken();
}

export function setTopbarConnectionState(connected) {
  const el = document.querySelector(".topbar-connected");
  if (!el) return;

  if (connected) {
    const claims = peekTokenClaims();
    const sub = claims?.sub ? String(claims.sub) : "";
    el.classList.add("is-connected");
    el.classList.remove("is-disconnected");
    el.innerHTML = `CONNECTED<span class="status-dot" aria-hidden="true"></span>`;
    el.title = sub ? `Connected as ${sub}` : "IWA connected";
  } else {
    el.classList.remove("is-connected");
    el.classList.add("is-disconnected");
    el.innerHTML = `DISCONNECTED<span class="status-dot" aria-hidden="true"></span>`;
    el.title = "Not connected — Windows IWA";
  }
}

/** Authorize with IWA if needed; updates topbar. Returns true when token ready. */
export async function ensureIwaSession({ force = false } = {}) {
  if (!force && getStoredToken()) {
    setTopbarConnectionState(true);
    return true;
  }

  if (connecting) return connecting;

  connecting = (async () => {
    try {
      await authorizeIwa();
      setTopbarConnectionState(true);
      return true;
    } catch (err) {
      console.warn("[IWA] auto-connect failed", err);
      clearToken();
      setTopbarConnectionState(false);
      return false;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export function disconnectIwaSession() {
  clearToken();
  setTopbarConnectionState(false);
}
