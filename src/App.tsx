import { useCallback, useEffect, useState } from "react";
import { RestTimer, unlockAudio, type TimerState } from "./components/RestTimer";
import { useAppState } from "./lib/storage";
import type { Availability } from "./lib/types";
import { Gym } from "./screens/Gym";
import { Library } from "./screens/Library";
import { Plan } from "./screens/Plan";
import { Progress } from "./screens/Progress";
import { Today } from "./screens/Today";

const TABS = [
  { id: "today", label: "Workout" },
  { id: "plan", label: "Plan" },
  { id: "progress", label: "Progress" },
  { id: "exercises", label: "Exercises" },
  { id: "gym", label: "My gym" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabFromHash(): TabId {
  const id = window.location.hash.slice(1);
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
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const online = useOnline();

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

  return (
    <div className={`app${timer ? " app--timer" : ""}`}>
      <header className="topbar">
        <h1>
          IRON <span>MODE</span>
        </h1>
      </header>
      {!online && (
        <p className="offline" role="status">
          Offline: everything still works and saves on this phone. Demo photos you haven't opened before won't load.
        </p>
      )}

      <main className="content">
        {tab === "today" && (
          <Today state={state} setState={setState} onAnswerEquipment={answerEquipment} onStartRest={startRest} />
        )}
        {tab === "plan" && <Plan state={state} setState={setState} />}
        {tab === "progress" && <Progress state={state} setState={setState} />}
        {tab === "exercises" && <Library state={state} />}
        {tab === "gym" && <Gym state={state} setState={setState} />}
      </main>

      <RestTimer timer={timer} sound={state.settings.timerSound} onChange={setTimer} />

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={t.id === tab ? "active" : ""} aria-current={t.id === tab ? "page" : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
