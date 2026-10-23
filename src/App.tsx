import { useEffect, useState } from "react";
import { useAppState } from "./lib/storage";
import type { Availability } from "./lib/types";
import { Gym } from "./screens/Gym";
import { Library } from "./screens/Library";
import { Plan } from "./screens/Plan";
import { Today } from "./screens/Today";

const TABS = [
  { id: "today", label: "Workout" },
  { id: "plan", label: "Plan" },
  { id: "exercises", label: "Exercises" },
  { id: "gym", label: "My gym" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabFromHash(): TabId {
  const id = window.location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? (id as TabId) : "today";
}

export default function App() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<TabId>(tabFromHash);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const answerEquipment = (id: string, value: Availability) =>
    setState((s) => ({ ...s, equipment: { ...s.equipment, [id]: value } }));

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          IRON <span>MODE</span>
        </h1>
      </header>

      <main className="content">
        {tab === "today" && <Today state={state} setState={setState} onAnswerEquipment={answerEquipment} />}
        {tab === "plan" && <Plan state={state} setState={setState} />}
        {tab === "exercises" && <Library state={state} />}
        {tab === "gym" && <Gym state={state} setState={setState} />}
      </main>

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
