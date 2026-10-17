export const PAUSE_PRESETS = [
  { label: "10 sec", seconds: 10 },
  { label: "30 sec", seconds: 30 },
  { label: "5 min", seconds: 300 },
];

export const PAUSE_ACTION_PREFIX = "pause:";
export const PAUSE_CUSTOM_ACTION = `${PAUSE_ACTION_PREFIX}custom`;
export const PAUSE_ACTION_PATTERN = /^pause:(\d+|custom)$/;
export const MAX_PAUSE_SECONDS = 24 * 60 * 60;
