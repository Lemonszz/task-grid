export type RNG = () => number;

export function mulberry32(seed: number): RNG {
	return function () {
		let t = (seed += 0x6D2B79F5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function stringToSeed(s: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
	}
	return (h >>> 0) || 1;
}

export function pickIndexFromWeights(rng: RNG, weights: number[]): number {
	const sum = weights.reduce((a, b) => a + b, 0);
	if (sum <= 0) return 0;
	let r = rng() * sum;
	for (let i = 0; i < weights.length; i++) {
		r -= weights[i];
		if (r <= 0) return i;
	}
	return weights.length - 1;
}
