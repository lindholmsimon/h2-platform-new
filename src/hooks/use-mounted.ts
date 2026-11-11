import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `true` först efter hydrering – för värden som bara finns i webbläsaren (t.ex. tema). */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
