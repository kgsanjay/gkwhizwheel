/**
 * GK WhizWheel Operations Mobile - Tap Target Scale
 * Designed for one-handed operation outdoors (jetties, docks, roadside dispatch)
 * where staff often operate the device while holding bike keys, helmets, or ropes.
 * 
 * WCAG 2.2 Level AAA recommends at least 44x44 dp, while operations hardware
 * standards target 48-56 dp minimum for reliable single-thumb outdoor use.
 */
export const touchTargets = {
  // Absolute minimum accessible tap target (icons, back buttons)
  min: 48,

  // Default tap target for standard buttons, inputs, and list rows
  default: 56,

  // Primary outdoor action button (e.g. Handover Key, Check-in, Scan QR)
  large: 64,

  // Bottom tab bar height for comfortable one-handed thumb reach
  tabBar: 68,

  // Quick action card height on dashboard
  actionCard: 96,
} as const;

export type TouchTargets = typeof touchTargets;
