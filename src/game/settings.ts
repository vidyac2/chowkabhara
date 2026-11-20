import { useSyncExternalStore } from "react";
import { setMuted } from "./sound";

export type Speed = "relaxed" | "normal" | "fast";

export interface Settings {
  sound: boolean;
  speed: Speed;
  /** Play the move automatically when only one pawn can move. */
  autoMove: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, speed: "normal", autoMove: true };

/** Milliseconds per square for each speed. */
export const STEP_MS: Record<Speed, number> = { relaxed: 300, normal: 210, fast: 130 };

const KEY = "chowka-bhara-settings";
const listeners = new Set<() => void>();
let cache: Settings | null = null;

function read(): Settings {
  if (cache) return cache;
  let value = DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) value = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
    else if (window.localStorage.getItem("chowka-bhara-muted") === "1") value = { ...value, sound: false };
  } catch {
    value = DEFAULT_SETTINGS;
  }
  cache = value;
  setMuted(!value.sound);
  return value;
}

export function updateSettings(patch: Partial<Settings>) {
  cache = { ...read(), ...patch };
  setMuted(!cache.sound);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: settings still apply for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
}
