import type { Difficulty, Item } from "../data/items";

export type Coord = { x: number; y: number };

export type ViewRange = {
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
};

export type GridState = {
	layoutSeed: string;
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	rerollPoints: number;
	overrides?: Record<string, string>;
};

export type TileAssignmentCache = {
	assignmentCache: Record<string, string>;
	consumedIds: Set<string>;
};

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master", "Passive"];
