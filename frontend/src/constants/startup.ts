/** Kept for as long as the tab lives: a page reloaded in it does not start up again. */
export const BOOTED_KEY = 'pop-search:booted';

/** Slow enough for each check to be read as it comes up. */
export const BOOT_LINE_EVERY_MS = 600;

/** How long the boot screen waits for the server before going in without it. */
export const BOOT_PATIENCE_MS = 6000;

export const BOOT_LEAVE_MS = 1400;

/** Longer, so the line saying it is going in without the server can be read. */
export const BOOT_LEAVE_UNANSWERED_MS = 1800;

export const SERVER_RETRY_MS = 2000;
export const SERVER_ATTEMPT_TIMEOUT_MS = 30000;
export const SERVER_GIVE_UP_MS = 120000;

/** On the desktop, how long a silent server goes without a word from the robot. */
export const SERVER_NOTICE_MS = 2500;
