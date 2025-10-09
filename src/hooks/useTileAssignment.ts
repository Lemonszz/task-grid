import { useRef, useCallback } from "react";
import type { Difficulty, Item } from "../data/items";
import { mulberry32, stringToSeed, pickIndexFromWeights } from "../utils/prng";
import { keyOf, manhattan } from "../utils/gridHelpers";
import { computeWeightsForDistance } from "../utils/difficultyWeights";

type TileAssignmentProps = {
	seed: string;
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	remainingIds: Set<string>;
	itemsById: Record<string, Item>;
	passiveChance: number;
	difficultyCounts: Record<Difficulty, number>;
	setAssigned: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	setRemainingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export function useTileAssignment({
	seed,
	assigned,
	completed,
	remainingIds,
	itemsById,
	passiveChance,
	difficultyCounts,
	setAssigned,
	setRemainingIds,
}: TileAssignmentProps) {
	// Synchronous cache to prevent race conditions
	const assignmentCacheRef = useRef<Record<string, string>>({});
	const consumedIdsRef = useRef<Set<string>>(new Set());
	const layoutRngRef = useRef<(() => number) | null>(null);

	const syncCaches = useCallback((loadedAssigned: Record<string, string>) => {
		assignmentCacheRef.current = { ...loadedAssigned };
		consumedIdsRef.current = new Set(Object.values(loadedAssigned));
	}, []);

	const resetCaches = useCallback(() => {
		assignmentCacheRef.current = {};
		consumedIdsRef.current = new Set();
	}, []);

	const assignItemToTile = useCallback(
		(x: number, y: number): string | null => {
			const k = keyOf(x, y);

			// Check synchronous cache first
			if (assignmentCacheRef.current[k] !== undefined) {
				return assignmentCacheRef.current[k];
			}

			// Check async state
			if (assigned[k]) {
				assignmentCacheRef.current[k] = assigned[k];
				consumedIdsRef.current.add(assigned[k]);
				return assigned[k];
			}

			if (!layoutRngRef.current) layoutRngRef.current = mulberry32(stringToSeed(seed));
			const rng = layoutRngRef.current;
			if (!rng) return null;

			// Calculate distance first
			const d = manhattan(x, y);

			// Passive chance separate (but not at origin)
			const isPassive = d > 0 && rng() < passiveChance;
			let selectedId: string | null = null;

			if (isPassive) {
				// find any passive item available (excluding consumed items)
				const passiveIds = Array.from(remainingIds)
					.filter((id) => !consumedIdsRef.current.has(id))
					.filter((id) => itemsById[id].difficulty === "Passive");
				if (passiveIds.length > 0) {
					const sel = Math.floor(rng() * passiveIds.length);
					selectedId = passiveIds[sel];
				}
			}

			if (!selectedId) {
				// Otherwise pick tier by distance weights
				const weights = computeWeightsForDistance(d, passiveChance, difficultyCounts, completed, assigned, itemsById);
				const idx = pickIndexFromWeights(rng, weights);
				const chosenTier = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master"][idx] as Difficulty;

				// pick random item of that tier (excluding consumed items)
				const candidates = Array.from(remainingIds)
					.filter((id) => !consumedIdsRef.current.has(id))
					.filter((id) => itemsById[id].difficulty === chosenTier);
				if (candidates.length > 0) {
					const sel = Math.floor(rng() * candidates.length);
					selectedId = candidates[sel];
				}
			}

			if (!selectedId) {
				// fallback: pick any remaining item (excluding consumed items)
				const any = Array.from(remainingIds).filter((id) => !consumedIdsRef.current.has(id));
				if (any.length > 0) {
					selectedId = any[Math.floor(rng() * any.length)];
				}
			}

		if (!selectedId) {
			// pool exhausted
			return null;
		}

		// Only mark as consumed AFTER successful selection
		assignmentCacheRef.current[k] = selectedId;
		consumedIdsRef.current.add(selectedId);

		// Update both assigned and remainingIds atomically to prevent orphaned items
		setAssigned((prev) => {
			// Double-check we're not overwriting an existing assignment
			if (prev[k]) {
				// Rollback: Remove from consumed set since we're not using it
				consumedIdsRef.current.delete(selectedId);
				assignmentCacheRef.current[k] = prev[k];
				return prev;
			}
			
			// Assignment succeeds, remove from remaining pool in same update cycle
			setRemainingIds((prevRemaining) => {
				const copy = new Set(prevRemaining);
				copy.delete(selectedId!);
				return copy;
			});
			
			return { ...prev, [k]: selectedId };
		});

		return selectedId;
	},
	[seed, assigned, remainingIds, itemsById, passiveChance, difficultyCounts, setAssigned, setRemainingIds]
);	const rerollTile = useCallback(
		(x: number, y: number, completed: Record<string, boolean>, rerollPoints: number): boolean => {
			if (rerollPoints <= 0) return false;
			const k = keyOf(x, y);
			if (!assigned[k]) return false;
			if (completed[k]) return false;

			// pick replacement from remaining pool using distance bias
			if (!layoutRngRef.current) layoutRngRef.current = mulberry32(stringToSeed(seed));
			const rng = layoutRngRef.current;
			if (!rng) return false;
			
			// Get the old item
			const old = assigned[k];

			// try assign a new one
			const d = manhattan(x, y);
			const isPassive = rng() < passiveChance;
			let newId: string | null = null;
			if (isPassive) {
				// Add old item back temporarily to check passive pool, exclude consumed items
				const passiveIds = Array.from(remainingIds)
					.concat(old)
					.filter((id) => id === old || !consumedIdsRef.current.has(id))
					.filter((id) => itemsById[id].difficulty === "Passive");
				if (passiveIds.length > 0) {
					const sel = Math.floor(rng() * passiveIds.length);
					newId = passiveIds[sel];
				}
			}
			if (!newId) {
				const weights = computeWeightsForDistance(d, passiveChance, difficultyCounts, completed, assigned, itemsById);
				const idx = pickIndexFromWeights(rng, weights);
				const chosenTier = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master"][idx] as Difficulty;
				// Add old item back temporarily to check candidates, exclude consumed items
				const candidates = Array.from(remainingIds)
					.concat(old)
					.filter((id) => id === old || !consumedIdsRef.current.has(id))
					.filter((id) => itemsById[id].difficulty === chosenTier);
				if (candidates.length > 0) {
					const sel = Math.floor(rng() * candidates.length);
					newId = candidates[sel];
				}
			}
			// fallback - add old item back temporarily, exclude consumed items
			const any = Array.from(remainingIds)
				.concat(old)
				.filter((id) => id === old || !consumedIdsRef.current.has(id));
			if (!newId && any.length > 0) newId = any[Math.floor(rng() * any.length)];
			if (!newId) {
				// no items left
				return false;
			}

			// Update synchronous cache
			if (newId !== old) {
				consumedIdsRef.current.delete(old);
				consumedIdsRef.current.add(newId);
			}
			assignmentCacheRef.current[k] = newId;

			// Atomically swap items
			setAssigned((prev) => {
				const updated = { ...prev };
				updated[k] = newId!;
				return updated;
			});

			// Update remaining pool - remove new, add back old (if different)
			if (newId !== old) {
				setRemainingIds((r) => {
					const copy = new Set(r);
					copy.delete(newId!);
					copy.add(old);
					return copy;
				});
			}

			return true;
		},
		[seed, assigned, remainingIds, itemsById, passiveChance, difficultyCounts, setAssigned, setRemainingIds]
	);

	return {
		assignItemToTile,
		rerollTile,
		syncCaches,
		resetCaches,
		layoutRngRef,
	};
}
