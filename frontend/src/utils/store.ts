/**
 * Something kept apart from the rest of the screen: only what reads it is drawn
 * again when it changes.
 */
export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (notify: () => void) => () => void;
}

export const createStore = <T>(first: T): Store<T> => {
  let held = first;
  const watching = new Set<() => void>();

  return {
    get: () => held,
    set: (next) => {
      held = next;
      watching.forEach((notify) => notify());
    },
    subscribe: (notify) => {
      watching.add(notify);
      return () => watching.delete(notify);
    },
  };
};
