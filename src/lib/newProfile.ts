import { PRESETS_BY_ID } from "../data/presets";
import { defaultState, type AppState } from "./storage";

export interface NewProfileOptions {
  /** A gym preset id, or "copy:<profileId>" to reuse another profile's gym. */
  gym: string;
  elbowFriendly: boolean;
  fastingDays: boolean;
}

/** Fresh data for a new person; nothing is carried over from anyone else but their chosen gym setup. */
export function newProfileState(opts: NewProfileOptions, others: { id: string; state: AppState }[] = []): AppState {
  const state = defaultState();
  state.settings.elbowFriendly = opts.elbowFriendly;
  state.settings.fastingDays = opts.fastingDays;

  if (opts.gym.startsWith("copy:")) {
    const source = others.find((p) => `copy:${p.id}` === opts.gym);
    if (source) {
      state.equipment = { ...source.state.equipment };
      state.settings.ownGymPhotos = source.state.settings.ownGymPhotos;
      return state;
    }
  }
  const preset = PRESETS_BY_ID.get(opts.gym) ?? PRESETS_BY_ID.get("later")!;
  state.equipment = preset.build();
  state.settings.ownGymPhotos = preset.ownPhotos;
  return state;
}
