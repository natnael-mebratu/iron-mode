import { afterEach, describe, expect, it, vi } from "vitest";
import { PRESETS } from "../data/presets";
import { newProfileState } from "./newProfile";
import {
  addProfile,
  defaultState,
  emptyStore,
  loadStore,
  removeProfile,
  renameProfile,
  sanitize,
  sanitizeStore,
  type Profile,
  type WorkoutLog,
} from "./storage";
import { detectEnv } from "./install";

const profile = (id: string, name: string, state = defaultState()): Profile => ({ id, name, createdAt: "2026-01-01T00:00:00Z", state });

function stubStorage(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe("profiles", () => {
  it("adds, renames and removes profiles, keeping a valid active one", () => {
    let store = addProfile(emptyStore(), profile("a", "Ann"));
    store = addProfile(store, profile("b", "Ben"));
    expect(store.activeId).toBe("b");
    store = renameProfile(store, "a", "  Anna   Lee ");
    expect(store.profiles[0].name).toBe("Anna Lee");
    expect(renameProfile(store, "a", "   ")).toBe(store);
    store = removeProfile(store, "b");
    expect(store.activeId).toBe("a");
    store = removeProfile(store, "a");
    expect(store).toEqual({ version: 3, activeId: "", profiles: [] });
  });

  it("keeps each person's data separate", () => {
    const log: WorkoutLog = { date: "2026-10-01", planId: "ppl-3", sessionId: "push", entries: {} };
    const ann = { ...defaultState(), logs: { "2026-10-01": log } };
    const store = addProfile(addProfile(emptyStore(), profile("a", "Ann", ann)), profile("b", "Ben"));
    expect(Object.keys(store.profiles[0].state.logs)).toHaveLength(1);
    expect(Object.keys(store.profiles[1].state.logs)).toHaveLength(0);
  });

  it("sanitizes a stored store: drops duplicates and bad profiles, repairs the active id", () => {
    const raw = {
      version: 3,
      activeId: "gone",
      profiles: [profile("a", "Ann"), profile("a", "Dup"), { nope: true }, profile("b", "")],
    };
    const store = sanitizeStore(JSON.parse(JSON.stringify(raw)));
    expect(store.profiles.map((p) => p.id)).toEqual(["a", "b"]);
    expect(store.profiles[1].name).toBe("Me");
    expect(store.activeId).toBe("a");
    expect(sanitizeStore("junk")).toEqual(emptyStore());
  });
});

describe("migrating from the single-person version", () => {
  const legacy = {
    version: 2,
    equipment: { dumbbells: "unavailable" },
    activePlanId: "ppl-3",
    logs: { "2026-10-17": { planId: "ppl-3", sessionId: "push", entries: { "push-press": { exerciseId: "chest-press-machine", sets: [{ weight: 40, reps: 10, done: true }] } } } },
    body: [{ date: "2026-10-17", weightKg: 56 }],
    settings: { elbowFriendly: true },
  };

  it("turns existing data into the first profile without losing anything", () => {
    const data = stubStorage({ "iron-mode:state": JSON.stringify(legacy) });
    const store = loadStore();
    expect(store.profiles).toHaveLength(1);
    const p = store.profiles[0];
    expect(p.name).toBe("Me");
    expect(store.activeId).toBe(p.id);
    expect(p.state.logs["2026-10-17"].entries["push-press"].sets[0].weight).toBe(40);
    expect(p.state.body[0].weightKg).toBe(56);
    expect(p.state.equipment.dumbbells).toBe("unavailable");
    expect(p.state.activePlanId).toBe("ppl-3");
    // The original owner keeps their own-gym photos and fasting reminder.
    expect(p.state.settings.ownGymPhotos).toBe(true);
    expect(p.state.settings.fastingDays).toBe(true);
    // The old key is left in place as a safety copy.
    expect(data.get("iron-mode:state")).toBeDefined();
  });

  it("does not re-import old data once profiles exist (even if all were deleted)", () => {
    stubStorage({ "iron-mode:state": JSON.stringify(legacy), "iron-mode:store": JSON.stringify(emptyStore()) });
    expect(loadStore().profiles).toHaveLength(0);
  });

  it("starts empty (welcome screen) on a brand-new install, and keeps unreadable data instead of overwriting it", () => {
    stubStorage({});
    expect(loadStore()).toEqual(emptyStore());
    const data = stubStorage({ "iron-mode:store": "{broken" });
    expect(loadStore()).toEqual(emptyStore());
    expect(data.get("iron-mode:unreadable-backup")).toBe("{broken");
  });
});

describe("new people and gym presets", () => {
  it("starts a new person with a clean slate and only their chosen gym", () => {
    const owner = defaultState();
    owner.logs["2026-10-01"] = { date: "2026-10-01", planId: "ppl-3", sessionId: "push", entries: {} };
    owner.body = [{ date: "2026-10-01", weightKg: 56, waistCm: null, note: "" }];
    const s = newProfileState({ gym: "home-dumbbells", elbowFriendly: false, fastingDays: false }, [{ id: "o", state: owner }]);
    expect(s.logs).toEqual({});
    expect(s.body).toEqual([]);
    expect(s.equipment.dumbbells).toBe("available");
    expect(s.equipment["adjustable-bench"]).toBe("available");
    expect(s.equipment["leg-press"]).toBe("unavailable");
    expect(s.settings.ownGymPhotos).toBe(false);
    expect(s.settings.elbowFriendly).toBe(false);
  });

  it("applies the person's own choices, not the original owner's", () => {
    const s = newProfileState({ gym: "commercial", elbowFriendly: true, fastingDays: true });
    expect(s.settings.elbowFriendly).toBe(true);
    expect(s.settings.fastingDays).toBe(true);
    expect(s.equipment["leg-press"]).toBe("available");
    expect(s.equipment["hip-abduction"]).toBe("unknown");
  });

  it("can copy another person's gym, but not their workouts", () => {
    const owner = defaultState();
    owner.equipment["leg-press"] = "unavailable";
    owner.settings.ownGymPhotos = true;
    owner.swaps = { "ct-press": "db-bench-press" };
    const s = newProfileState({ gym: "copy:o", elbowFriendly: false, fastingDays: false }, [{ id: "o", state: owner }]);
    expect(s.equipment["leg-press"]).toBe("unavailable");
    expect(s.settings.ownGymPhotos).toBe(true);
    expect(s.swaps).toEqual({});
  });

  it("every preset covers every piece of equipment and uses valid values", () => {
    const ids = Object.keys(defaultState().equipment);
    for (const preset of PRESETS) {
      const eq = preset.build();
      expect(Object.keys(eq).sort(), preset.id).toEqual([...ids].sort());
      for (const v of Object.values(eq)) expect(["available", "unavailable", "unknown"]).toContain(v);
    }
  });

  it("bodyweight-only really has no equipment", () => {
    const eq = PRESETS.find((p) => p.id === "bodyweight")!.build();
    expect(Object.values(eq).every((v) => v === "unavailable")).toBe(true);
  });
});

describe("swaps are saved", () => {
  it("round-trips saved and per-day swaps and drops junk", () => {
    const s = sanitize({
      version: 2,
      swaps: { "ct-press": "db-bench-press", bad: 5 },
      logs: { "2026-10-01": { planId: "current-split", sessionId: "chest-triceps", entries: {}, swaps: { "ct-fly": "incline-db-fly", x: null } } },
    });
    expect(s.swaps).toEqual({ "ct-press": "db-bench-press" });
    expect(s.logs["2026-10-01"].swaps).toEqual({ "ct-fly": "incline-db-fly" });
  });
});

describe("install environment detection", () => {
  const ua = {
    chrome: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
    tiktok: "Mozilla/5.0 (Linux; Android 14; SM-S911B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 musical_ly_2023",
    webview: "Mozilla/5.0 (Linux; Android 13; SM-A536B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36",
    samsung: "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
    iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };

  it("recognises where the app is being opened", () => {
    expect(detectEnv(ua.chrome, false)).toBe("android-chrome");
    expect(detectEnv(ua.tiktok, false)).toBe("inapp");
    expect(detectEnv(ua.webview, false)).toBe("inapp");
    expect(detectEnv(ua.samsung, false)).toBe("android-other");
    expect(detectEnv(ua.iphone, false)).toBe("ios");
    expect(detectEnv(ua.desktop, false)).toBe("desktop");
    expect(detectEnv(ua.chrome, true)).toBe("installed");
  });
});
