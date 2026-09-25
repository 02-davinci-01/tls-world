'use client';

import { useSyncExternalStore } from 'react';

/** Tiny global store for cross-cutting page state (hum, music, greed sequence, boot). */
type State = { humOn: boolean; greedOn: boolean; musicOn: boolean; booted: boolean };

let state: State = { humOn: false, greedOn: false, musicOn: false, booted: false };
const listeners = new Set<() => void>();

export const getGlobal = () => state;
export function setGlobal(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverState: State = { humOn: false, greedOn: false, musicOn: false, booted: false };

export function useGlobal<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(serverState));
}
