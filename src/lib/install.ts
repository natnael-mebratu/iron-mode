import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallEnv =
  | "installed" // already running as an installed app
  | "inapp" // inside another app's browser (TikTok, Facebook, Telegram…), which can't install
  | "android-chrome"
  | "android-other"
  | "ios"
  | "desktop";

export function detectEnv(ua = navigator.userAgent, standalone = isStandalone()): InstallEnv {
  if (standalone) return "installed";
  // Android WebViews add "; wv)", and many social apps add their own name.
  if (/; wv\)|FBAN|FBAV|Instagram|TikTok|musical_ly|Telegram|Line\/|Snapchat|Twitter|LinkedInApp/i.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return /Chrome\//.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox|DuckDuckGo/i.test(ua) ? "android-chrome" : "android-other";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Captures the browser's install prompt so the app can offer its own Install button. */
export function useInstall() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    return outcome === "accepted";
  };

  return { canPrompt: !!event, installed, env: installed ? ("installed" as const) : detectEnv(), install };
}
