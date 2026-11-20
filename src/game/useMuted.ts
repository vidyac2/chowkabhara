import { useEffect, useState } from "react";
import { setMuted } from "./sound";

const KEY = "chowka-bhara-muted";

export function useMuted() {
  const [muted, setState] = useState(false);

  useEffect(() => {
    setState(window.localStorage.getItem(KEY) === "1");
  }, []);

  useEffect(() => {
    setMuted(muted);
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  }, [muted]);

  return [muted, () => setState((m) => !m)] as const;
}
