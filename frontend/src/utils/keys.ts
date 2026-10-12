const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock']);

/** "Any key", minus the ones that are the browser's: a shortcut, or F5 and F12. */
export const isAnyKey = (event: KeyboardEvent): boolean =>
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey &&
  !MODIFIERS.has(event.key) &&
  !/^F\d+$/.test(event.key);
