"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void) => {
  const frameId = window.requestAnimationFrame(onStoreChange);

  return () => {
    window.cancelAnimationFrame(frameId);
  };
};

export function useHydratedStore() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
