export const POLLING_INTERVAL_MS = 10_000;
export const SPOTLIGHT_DURATION_MS = 10_000;
export const SPOTLIGHT_AUDIO_FADE_MS = 2_000;

/**
 * Spotlight stage timing (ms from event start).
 * Phases run sequentially: flash → arm → stream → reveal → close.
 *
 *   flash:  brief silver flash + camera shake.
 *   arm:    emitter rises into position from below; mechanical SFX.
 *   stream: continuous burst — tokens stream upward toward the name,
 *           counter ramps from 0 to amount, burst SFX plays.
 *   reveal: tokens settle/fade, counter holds at final value, stinger SFX.
 */
export const STAGE_FLASH_MS = 220;
export const STAGE_ARM_MS = 600;
export const STAGE_STREAM_MS = 1_700;
export const STAGE_REVEAL_MS = 1_400;

export const PROCESSED_SALES_LIMIT = 1_000;
export const HOUSE_NAME = "GROUP I.A";
