import { useState } from "react";
import { InstallCard } from "../components/InstallCard";
import { ProfileForm } from "../components/ProfileForm";
import type { InstallEnv } from "../lib/install";
import { cleanName, type AppState, type Store } from "../lib/storage";

interface Props {
  store: Store;
  state: AppState;
  install: { env: InstallEnv; canPrompt: boolean; install: () => Promise<boolean> };
  actions: {
    create: (name: string, state: AppState) => string;
    switchTo: (id: string) => void;
    rename: (id: string, name: string) => void;
    remove: (id: string) => void;
  };
}

const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

const lastWorkout = (state: AppState) => {
  const dates = Object.values(state.logs)
    .filter((l) => Object.values(l.entries).some((e) => e.sets.some((s) => s.done)))
    .map((l) => l.date)
    .sort();
  return { count: dates.length, last: dates.at(-1) };
};

export function Profile({ store, state, install, actions }: Props) {
  const active = store.profiles.find((p) => p.id === store.activeId)!;
  const [name, setName] = useState(active.name);
  const [adding, setAdding] = useState(false);
  const [shared, setShared] = useState<string | null>(null);

  const link = window.location.origin + window.location.pathname;
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "IRON MODE",
          text: "A free workout tracker that builds your plan around the equipment at your gym.",
          url: link,
        });
        return;
      }
      await navigator.clipboard.writeText(link);
      setShared("Link copied ✓");
    } catch {
      /* share sheet dismissed */
    }
  };

  const remove = (id: string, profileName: string) => {
    if (store.profiles.length <= 1) return;
    if (
      confirm(
        `Delete ${profileName}'s profile? Their workouts, body entries and settings are removed from this phone. Save a backup first if you want to keep them.`,
      )
    ) {
      actions.remove(id);
    }
  };

  return (
    <section>
      <h2>Profile</h2>

      <div className="panel">
        <div className="who">
          <span className="avatar avatar--big" aria-hidden="true">
            {initial(active.name)}
          </span>
          <div className="who__body">
            <label className="field">
              <span className="muted small">Name</span>
              <input
                className="textinput"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => (cleanName(name) ? actions.rename(active.id, name) : setName(active.name))}
              />
            </label>
            <p className="muted small">
              {lastWorkout(state).count} workouts logged. Data is saved on this phone only.
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>People on this phone</h3>
        <ul className="people">
          {store.profiles.map((p) => {
            const stats = lastWorkout(p.state);
            const isActive = p.id === store.activeId;
            return (
              <li key={p.id} className={isActive ? "people--active" : ""}>
                <span className="avatar" aria-hidden="true">
                  {initial(p.name)}
                </span>
                <span className="people__name">
                  <strong>{p.name}</strong>
                  <span className="muted small block">{stats.count} workouts</span>
                </span>
                {isActive ? (
                  <span className="badge badge--done">Using now</span>
                ) : (
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => actions.switchTo(p.id)}>
                    Switch
                  </button>
                )}
                {store.profiles.length > 1 && (
                  <button
                    type="button"
                    className="linkbtn"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => remove(p.id, p.name)}
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {adding ? (
          <ProfileForm
            others={store.profiles}
            submitLabel="Create profile"
            onCancel={() => setAdding(false)}
            onSubmit={(n, s) => {
              actions.create(n, s);
              setAdding(false);
            }}
          />
        ) : (
          <button type="button" className="btn btn--small" onClick={() => setAdding(true)}>
            + Add a person
          </button>
        )}
        <p className="muted tiny">
          Each person has their own gym setup, workouts, history and settings. Switching is instant.
        </p>
      </div>

      <div className="panel">
        <h3>Share IRON MODE</h3>
        <p className="muted small">
          It's free and needs no account. Everyone who opens the link gets their own profile and their own data on their
          own phone. Nothing is uploaded.
        </p>
        <button type="button" className="btn btn--small" onClick={share}>
          Share the app
        </button>
        {shared && <span className="ok small"> {shared}</span>}
        <p className="muted tiny">{link}</p>
      </div>

      <InstallCard env={install.env} canPrompt={install.canPrompt} onInstall={install.install} />

      <p className="muted tiny build">IRON MODE · version {__BUILD__}</p>
    </section>
  );
}
