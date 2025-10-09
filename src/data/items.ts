export type Difficulty = "Beginner" | "Easy" | "Medium" | "Hard" | "Elite" | "Master" | "Passive";

export type Item = {
	id: string;
	title: string;
	description: string;
	difficulty: Difficulty;
	imageUrl: string;
};

const difficulties: Difficulty[] = [
	"Beginner",
	"Easy",
	"Medium",
	"Hard",
	"Elite",
	"Master",
	"Passive"
];

function pickDifficultyByIndex(i: number): Difficulty {
	// Make earlier items more likely to be easy, but distribute passives ~10%
	// Check non-passive tiers first, then passive last
	if (i % 10 !== 0) {
		// Not a passive slot
		if (i < 250) return "Beginner";
		if (i < 500) return "Easy";
		if (i < 700) return "Medium";
		if (i < 850) return "Hard";
		if (i < 950) return "Elite";
		return "Master";
	}
	// Every 10th item is Passive
	return "Passive";
}

// Fallback sample items (used if CSV fails to load)
export const SAMPLE_ITEMS: Item[] = Array.from({ length: 1000 }).map((_, i) => {
	const difficulty = pickDifficultyByIndex(i);
	return {
		id: `item_${i + 1}`,
		title: `${difficulty} Task #${i + 1}`,
		description: `A ${difficulty.toLowerCase()} task. Complete it to gain rewards and unlock adjacent tiles.`,
		difficulty: difficulty,
		imageUrl: `https://placekittens.com/400/400?image=${i % 16}`
	};
});

// Will be populated with items from CSV
let loadedItems: Item[] | null = null;

/**
 * Get items - returns loaded CSV items if available, otherwise sample items
 */
export function getItems(): Item[] {
	return loadedItems || SAMPLE_ITEMS;
}

/**
 * Set the loaded items from CSV
 */
export function setLoadedItems(items: Item[]): void {
	loadedItems = items;
}
