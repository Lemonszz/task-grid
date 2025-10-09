import type { Difficulty } from "../data/items";

export function computeWeightsForDistance(
	d: number,
	passiveChance: number,
	counts: Record<Difficulty, number>,
	completed?: Record<string, boolean>,
	assigned?: Record<string, string>,
	itemsById?: Record<string, any>
): number[] {
	if (!completed || !assigned || !itemsById) {
		return [1, 0, 0, 0, 0, 0];
	}

	const tierOrder: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master"];
	const completionPercent: Record<Difficulty, number> = {
		Beginner: 0,
		Easy: 0,
		Medium: 0,
		Hard: 0,
		Elite: 0,
		Master: 0,
		Passive: 0,
	};

	tierOrder.forEach((difficulty) => {
		const totalCount = counts[difficulty] || 0;
		if (totalCount === 0) {
			completionPercent[difficulty] = 0;
			return;
		}

		let completedCount = 0;
		Object.entries(assigned).forEach(([coord, itemId]) => {
			const item = itemsById[itemId];
			if (item && item.difficulty === difficulty && completed[coord]) {
				completedCount++;
			}
		});

		completionPercent[difficulty] = completedCount / totalCount;
	});

	const weights: number[] = [];
	let remainingProbability = 1.0;

	tierOrder.forEach((difficulty, index) => {
		if (index === tierOrder.length - 1) {
			weights.push(remainingProbability);
		} else {
			const completionPct = completionPercent[difficulty];
			const tierWeight = remainingProbability * (1 - completionPct);
			weights.push(tierWeight);
			
			remainingProbability *= completionPct;
		}
	});

	const total = weights.reduce((sum, w) => sum + w, 0);
	if (total === 0) return [1, 0, 0, 0, 0, 0];
	return weights.map(w => w / total);
}
