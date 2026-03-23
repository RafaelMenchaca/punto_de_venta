"use client";

import { useSyncExternalStore } from "react";

export function useHydratedStore() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
