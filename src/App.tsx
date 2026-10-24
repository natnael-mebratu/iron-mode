import { useCallback, useEffect, useState } from "react";
import { InstallCard } from "./components/InstallCard";
import { OwnPhotosContext } from "./components/OwnPhotos";
import { ProfileForm } from "./components/ProfileForm";
import { RestTimer, unlockAudio, type TimerState } from "./components/RestTimer";
import { useInstall } from "./lib/install";
import { useStore } from "./lib/storage";
import type { Availability } from "./lib/types";
import { Gym } from "./screens/Gym";
import { Library } from "./screens/Library";
import { Plan } from "./screens/Plan";
import { Profile } from "./screens/Profile";
import { Progress } from "./screens/Progress";
import { Today } from "./screens/Today";

// Simple inline icons (24×24, stroke) so the tab bar is readable at a glance.
const ICONS = {
  today: "M6 9v6M18 9v6M3 11v2M21 11v2M6 12h12",
  plan: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  progress: "M4 19h16M6 16l4-5 3 3 5-7",
  exercises: "M5 5h14M5 12h14M5 19h9",
  gym: "M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z",
};

const TABS = [
  { id: "today", label: "Workout" },
  { id: "plan", label: "Plan" },
  { id: "progress", label: "Progress" },
  { id: "exercises", label: "Exercises" },
  { id: "gym", label: "My gym" },
] as const;
type TabId = (typeof TABS)[number]["id"] | "profile";

function tabFromHash(): TabId {
  const id = window.location.hash.slice(1);
  if (id === "profile") return "profile";
  return TABS.some((t) => t.id === id) ? (id as TabId) : "today";
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export default function App() {
  const { store, profile, state, setState, actions } = useStore();
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const online = useOnline();
  const install = useInstall();

  useEffect(() => {
    const onHash = () => {
      setTab(tabFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const answerEquipment = (id: string, value: Availability) =>
    setState((s) => ({ ...s, equipment: { ...s.equipment, [id]: value } }));

  const startRest = useCallback((seconds: number, label: string) => {
    unlockAudio();
    setTimer({ endsAt: Date.now() + seconds * 1000, total: seconds, label });
  }, []);

  // First visit: ask who is using the app before showing anything else.
  if (!profile) {
    return (
      <div className="app">
        <header className="topbar">
          <h1>
            IRON <span>MODE</span>
          </h1>
        </header>
        <main className="content">
          <h2>Welcome</h2>
          <p className="muted">
            A free workout tracker that builds your plan around the equipment your gym actually has. Your data stays on
            this phone.
          </p>
          <ProfileForm
            others={[]}
            submitLabel="Start"
            onSubmit={(name, s) => {
              actions.create(name, s);
              window.location.hash = "#today";
            }}
          />
          <InstallCard env={install.env} canPrompt={install.canPrompt} onInstall={install.install} />
        </main>
      </div>
    );
  }

  const showInstallBanner = install.canPrompt && !state.settings.installBannerDismissed && tab === "today";

  return (
    <div className={`app${timer ? " app--timer" : ""}`}>
      <header className="topbar">
        <h1>
          IRON <span>MODE</span>
        </h1>
        <a href="#profile" className={`profilelink${tab === "profile" ? " profilelink--on" : ""}`} aria-label={`Profile: ${profile.name}`}>
          <span className="profilelink__name">{profile.name}</span>
          <span className="avatar" aria-hidden="true">
            {(profile.name.trim()[0] ?? "?").toUpperCase()}
          </span>
        </a>
      </header>
      {!online && (
        <p className="offline" role="status">
          Offline: everything still works and saves on this phone. Demo photos you haven't opened before won't load.
        </p>
      )}

      <OwnPhotosContext.Provider value={state.settings.ownGymPhotos}>
      <main className="content" key={profile.id}>
        {showInstallBanner && (
          <aside className="prompt">
            <p>
              <strong>Install IRON MODE</strong> for a home-screen icon, full-screen use and offline access.
            </p>
            <div className="btnrow">
              <button type="button" className="btn btn--small" onClick={install.install}>
                Install
              </button>
              <button
                type="button"
                className="btn btn--small btn--ghost"
                onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, installBannerDismissed: true } }))}
              >
                Not now
              </button>
            </div>
          </aside>
        )}
        {tab === "today" && (
          <Today state={state} setState={setState} onAnswerEquipment={answerEquipment} onStartRest={startRest} />
        )}
        {tab === "plan" && <Plan state={state} setState={setState} />}
        {tab === "progress" && <Progress state={state} setState={setState} />}
        {tab === "exercises" && <Library state={state} />}
        {tab === "gym" && <Gym state={state} setState={setState} />}
        {tab === "profile" && <Profile store={store} state={state} install={install} actions={actions} />}
      </main>
      </OwnPhotosContext.Provider>

      <RestTimer timer={timer} sound={state.settings.timerSound} onChange={setTimer} />

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={t.id === tab ? "active" : ""} aria-current={t.id === tab ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={ICONS[t.id]} />
            </svg>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
