import { useEffect, useState } from "react";
import type { InstallEnv } from "../lib/install";

interface Check {
  label: string;
  ok: boolean | null;
  hint: string;
}

/** A plain-language self-check for "why isn't install offered?". */
export function InstallDiagnostics({ env, canPrompt }: { env: InstallEnv; canPrompt: boolean }) {
  const [checks, setChecks] = useState<Check[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
      const quota = (await navigator.storage?.estimate?.().catch(() => undefined))?.quota;
      const manifest = await fetch(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? "", { cache: "no-store" })
        .then((r) => r.ok)
        .catch(() => false);
      const list: Check[] = [
        { label: "Secure page (https)", ok: window.isSecureContext, hint: "Open the https:// link." },
        { label: "App files found", ok: manifest, hint: "Reload the page. If it keeps failing, the site may be updating." },
        { label: "Works offline (service worker)", ok: !!reg?.active, hint: "Stay on the page a few seconds, then reload once." },
        {
          label: "Normal tab (not Incognito)",
          ok: quota === undefined ? null : quota > 300 * 1024 * 1024,
          hint: "Chrome can't install from Incognito. Open a normal tab.",
        },
        {
          label: "Opened in the browser itself",
          ok: env !== "inapp",
          hint: "Open the link in the Chrome app, not from inside another app.",
        },
        { label: "Chrome is offering install now", ok: canPrompt || env === "installed", hint: "If everything above is ✓ but this isn't, use ⋮ → Add to Home screen." },
      ];
      if (alive) setChecks(list);
    })();
    return () => {
      alive = false;
    };
  }, [env, canPrompt]);

  return (
    <details className="explain">
      <summary>Install not working? Run the check</summary>
      {!checks && <p className="muted small">Checking…</p>}
      {checks && (
        <ul className="checks">
          {checks.map((c) => (
            <li key={c.label}>
              <span className={c.ok === true ? "ok" : c.ok === false ? "error" : "muted"} aria-hidden="true">
                {c.ok === true ? "✓" : c.ok === false ? "✗" : "?"}
              </span>
              <span>
                {c.label}
                {c.ok === false && <span className="muted small block">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
