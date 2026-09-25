'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** Filenames present in /public at build time, so empty slots never request a 404. */
const AssetsContext = createContext<ReadonlySet<string>>(new Set());

export function AssetsProvider({ files, children }: { files: string[]; children: ReactNode }) {
  return <AssetsContext.Provider value={new Set(files)}>{children}</AssetsContext.Provider>;
}

export const useAssets = () => useContext(AssetsContext);
