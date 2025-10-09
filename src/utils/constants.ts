/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for easier maintenance
 */

// Grid configuration
export const TILE_SIZE = 128;
export const VIEWPORT_BUFFER = 3; // Extra tiles rendered beyond viewport edges

// Animation durations (milliseconds)
export const TILE_REVEAL_DURATION = 1500;
export const TILE_CELEBRATION_DURATION = 500;
export const PAN_ANIMATION_DURATION = 500;
export const SLOT_CYCLE_INTERVAL = 100;
export const SLOT_CYCLES_COUNT = 15;

// Drag detection
export const DRAG_THRESHOLD = 5; // pixels

// Zoom limits
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.0;
export const ZOOM_OUT_THRESHOLD = 1.5; // Zoom level at which we auto-zoom out when panning to tiles

// Slot machine animation
export const SLOT_ANIMATION_ITEMS_COUNT = 15; // Number of random items to show during reveal
