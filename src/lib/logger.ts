const enabled = import.meta.env.DEV;

export const logger = {
  info: (...args: unknown[]) => {
    if (enabled) console.log("[bop]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (enabled) console.warn("[bop]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[bop]", ...args);
  },
};
