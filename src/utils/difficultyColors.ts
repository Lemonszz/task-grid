import type { Difficulty } from "../data/items";

/**
 * Color palette for difficulty tiers
 * Centralized to ensure consistency across the application
 */
export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
	Beginner: "#969696", // Grey
	Easy: "#28c850", // Green
	Medium: "#3c96ff", // Blue
	Hard: "#b464ff", // Purple
	Elite: "#ffc832", // Yellow
	Master: "#ff6464", // Red
	Passive: "#64ffff", // Cyan
};

/**
 * Get the color for a difficulty tier
 * Returns the tile background color with transparency
 */
export function getDifficultyColor(difficulty?: Difficulty): string {
	if (!difficulty) return "rgba(26, 39, 52, 1)"; // Default dark background
	return DIFFICULTY_COLORS[difficulty];
}

/**
 * Get the background color for a tile with the given difficulty
 * Includes transparency for better visual effect
 */
export function getTileBackgroundColor(difficulty?: Difficulty, isRevealed: boolean = false): string {
	if (!isRevealed || !difficulty) return "rgba(26, 39, 52, 1)";
	
	const color = DIFFICULTY_COLORS[difficulty];
	// Convert hex to rgba with 0.5 opacity
	const hex = color.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	
	return `rgba(${r}, ${g}, ${b}, 0.5)`;
}
