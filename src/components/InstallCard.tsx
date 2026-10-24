import { useState } from "react";
import type { InstallEnv } from "../lib/install";

interface Props {
  env: InstallEnv;
  canPrompt: boolean;
  onInstall: () => Promise<boolean>;
}

const url = () => window.location.origin + window.location.pathname;

/** Install help that matches what the browser can actually do right now. */
export function InstallCard({ env, canPrompt, onInstall }: Props) {
  const [copied, setCopied] = useState(false);
  const [declined, setDeclined] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
    } catch {
      window.prompt("Copy this link and open it in Chrome:", url());
    }
  };

  if (env === "installed") {
    return (
      <div className="panel">
        <h3>Installed ✓</h3>
        <p className="muted small">You're using IRON MODE as an installed app. It works offline.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Install on your phone</h3>

      {canPrompt && (
        <>
          <p className="small">Install IRON MODE so it opens full-screen from your home screen and works offline.</p>
          <button
            type="button"
            className="btn btn--block"
            onClick={async () => setDeclined(!(await onInstall()))}
          >
            Install IRON MODE
          </button>
          {declined && <p className="muted small">No problem. You can install it later from the browser menu (⋮).</p>}
        </>
      )}

      {env === "inapp" && (
        <>
          <p className="note">
            <strong>You're inside another app's browser</strong> (TikTok, Telegram, Facebook…). Those can't install apps.
            Open this link in <strong>Chrome</strong> instead.
          </p>
          <ol className="steps">
            <li>Tap <strong>Copy link</strong> below.</li>
            <li>Open the <strong>Chrome</strong> app and paste it into the address bar.</li>
            <li>Then tap Chrome's menu <strong>⋮ → Install app</strong> (or <strong>Add to Home screen</strong>).</li>
          </ol>
          <button type="button" className="btn btn--small" onClick={copy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </>
      )}

      {!canPrompt && env === "android-chrome" && (
        <ol className="steps">
          <li>
            Tap Chrome's menu <strong>⋮</strong> (top right).
          </li>
          <li>
            Tap <strong>Install app</strong>. If you only see <strong>Add to Home screen</strong>, tap that, then{" "}
            <strong>Install</strong>.
          </li>
          <li>IRON MODE appears on your home screen. Open it from there.</li>
          <li className="muted">
            Not in the menu? Reload this page once and wait a few seconds. Chrome offers install after the app has
            finished loading.
          </li>
        </ol>
      )}

      {!canPrompt && env === "android-other" && (
        <p className="small">
          This browser may not support installing. Open the link in <strong>Chrome</strong> and use{" "}
          <strong>⋮ → Install app</strong>. Samsung Internet: menu → <strong>Add page to → Home screen</strong>.
        </p>
      )}

      {env === "ios" && (
        <ol className="steps">
          <li>
            Open this link in <strong>Safari</strong>.
          </li>
          <li>
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
          </li>
        </ol>
      )}

      {env === "desktop" && !canPrompt && (
        <p className="small">In Chrome or Edge, use the install icon in the address bar, or the menu → Install.</p>
      )}

      <p className="muted tiny">
        You can also just keep using it in the browser. Installing only adds the home-screen icon and full-screen mode.
      </p>
    </div>
  );
}
